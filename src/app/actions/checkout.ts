'use server';

import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export interface CheckoutItemInput {
  variantId: string;
  quantity: number;
  productTitle?: string;
  unitPrice?: number;
}

export async function createCheckoutSessionAction(items: CheckoutItemInput[]) {
  if (!items || items.length === 0) {
    throw new Error('Cart cannot be empty');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Recalculate prices
  let lineItems = items.map((item) => ({
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

  try {
    const supabase = await createClient();
    const { data: dbVariants } = await supabase
      .from('product_variants')
      .select(`
        id,
        sku,
        color_name,
        additional_price,
        product:products (
          id,
          title,
          base_price
        )
      `)
      .in('id', items.map((i) => i.variantId));

    if (dbVariants && dbVariants.length > 0) {
      const vMap = new Map(dbVariants.map((v: any) => [v.id, v]));
      lineItems = items.map((item) => {
        const v = vMap.get(item.variantId);
        if (v && v.product) {
          const unitPrice = (v.product.base_price || 0) + (v.additional_price || 0);
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${v.product.title} (${v.color_name})`,
                metadata: { variant_id: v.id, sku: v.sku },
              },
              unit_amount: unitPrice,
            },
            quantity: item.quantity,
          };
        }
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.productTitle || 'Veiled Canvas Product',
              metadata: { variant_id: item.variantId },
            },
            unit_amount: item.unitPrice || 4500,
          },
          quantity: item.quantity,
        };
      });
    }
  } catch (err) {
    console.warn('Database lookup during checkout action fallback:', err);
  }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    redirect(`${siteUrl}/checkout/success?session_id=demo_${Date.now()}&mode=demo`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
  });

  if (session.url) {
    redirect(session.url);
  } else {
    throw new Error('Could not create Stripe checkout session');
  }
}
