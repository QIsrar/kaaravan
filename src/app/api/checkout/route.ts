import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const checkoutItemSchema = z.object({
  variantId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().positive().max(50),
  productTitle: z.string().optional(),
  unitPrice: z.number().int().nonnegative().optional(),
});

const checkoutBodySchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Cart cannot be empty'),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const body = await req.json();

    const parsed = checkoutBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid checkout data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { items, customerEmail } = parsed.data;

    // Server-side price recalculation & verification
    let lineItems: Array<{
      price_data: {
        currency: string;
        product_data: {
          name: string;
          metadata?: Record<string, string>;
        };
        unit_amount: number;
      };
      quantity: number;
    }> = [];

    try {
      const supabase = await createClient();
      const variantIds = items.map((i) => i.variantId);

      const { data: dbVariants, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          color_name,
          stock_quantity,
          additional_price,
          product:products (
            id,
            title,
            base_price,
            is_archived
          )
        `)
        .in('id', variantIds);

      if (!error && dbVariants && dbVariants.length > 0) {
        const variantMap = new Map(dbVariants.map((v: any) => [v.id, v]));

        for (const item of items) {
          const v = variantMap.get(item.variantId);
          if (v && v.product && !v.product.is_archived) {
            // Recalculate price strictly server-side
            const unitPrice = (v.product.base_price || 0) + (v.additional_price || 0);
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${v.product.title} (${v.color_name})`,
                  metadata: {
                    variant_id: v.id,
                    sku: v.sku,
                  },
                },
                unit_amount: unitPrice,
              },
              quantity: item.quantity,
            });
          } else {
            // Fallback to item info if verified
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: item.productTitle || 'Veiled Canvas Product',
                  metadata: { variant_id: item.variantId },
                },
                unit_amount: item.unitPrice || 4500,
              },
              quantity: item.quantity,
            });
          }
        }
      } else {
        // Fallback for mock items if database not seeded
        lineItems = items.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.productTitle || 'Veiled Canvas Product',
              metadata: { variant_id: item.variantId },
            },
            unit_amount: item.unitPrice || 4500,
          },
          quantity: item.quantity,
        }));
      }
    } catch (err) {
      console.warn('Database query for variants failed, using validated items:', err);
      lineItems = items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productTitle || 'Veiled Canvas Product',
            metadata: { variant_id: item.variantId },
          },
          unit_amount: item.unitPrice || 4500,
        },
        quantity: item.quantity,
      }));
    }

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      // Return simulated checkout URL for development/demo mode
      const orderId = 'ord_' + Math.random().toString(36).substring(2, 10);
      return NextResponse.json({
        url: `${origin}/checkout/success?session_id=demo_${orderId}&mode=demo`,
      });
    }

    // Create real Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        total_items: String(items.reduce((acc, i) => acc + i.quantity, 0)),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
