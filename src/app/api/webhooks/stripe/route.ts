import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (webhookSecret && webhookSecret !== 'whsec_placeholder') {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In development / demo mode when secret is not configured
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  let supabase: ReturnType<typeof createAdminClient> | null = null;
  try {
    supabase = createAdminClient();
  } catch (e) {
    console.warn('Supabase admin client unconfigured during webhook processing:', e);
  }

  // Idempotency check via stripe_events table
  if (supabase) {
    try {
      const { data: existingEvent } = await (supabase as any)
        .from('stripe_events')
        .select('id')
        .eq('id', event.id)
        .single();

      if (existingEvent) {
        // Event has already been processed idempotently
        return NextResponse.json({ received: true, status: 'already_processed' });
      }

      // Record this event
      await (supabase as any).from('stripe_events').insert({
        id: event.id,
        type: event.type,
      });
    } catch (e) {
      console.warn('Idempotency logging skipped:', e);
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const totalAmount = session.amount_total || 0; // in cents
        const currency = session.currency || 'usd';
        const userId = session.client_reference_id || null;

        if (supabase) {
          // 1. Insert order record
          const { data: order, error: orderError } = await (supabase as any)
            .from('orders')
            .insert({
              user_id: userId,
              guest_email: userId ? null : customerEmail,
              status: 'processing',
              total_amount: totalAmount,
              currency,
              stripe_session_id: session.id,
              stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
              shipping_address_snapshot: (session as any).shipping_details || null,
            })
            .select()
            .single();

          if (orderError) {
            console.error('Error inserting order in webhook:', orderError);
          } else if (order) {
            // 2. Fetch line items from session
            const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items.data.price.product'],
            });

            const lineItems = expandedSession.line_items?.data || [];

            for (const item of lineItems) {
              const product = item.price?.product as Stripe.Product | undefined;
              const variantId = product?.metadata?.variant_id;
              const quantity = item.quantity || 1;
              const unitAmount = item.price?.unit_amount || 0;

              if (variantId) {
                // Record order item
                await (supabase as any).from('order_items').insert({
                  order_id: order.id,
                  variant_id: variantId,
                  product_title: product?.name || item.description || 'Veiled Canvas Item',
                  variant_label: product?.metadata?.sku || 'Default',
                  quantity,
                  price_at_purchase: unitAmount,
                });

                // Atomic stock decrement: decrease stock only if available
                await (supabase as any).rpc('decrement_variant_stock', {
                  p_variant_id: variantId,
                  p_quantity: quantity,
                }).catch(async () => {
                  // Fallback direct update
                  const { data: v } = await (supabase as any)
                    .from('product_variants')
                    .select('stock_quantity')
                    .eq('id', variantId)
                    .single();
                  if (v) {
                    await (supabase as any)
                      .from('product_variants')
                      .update({ stock_quantity: Math.max(0, v.stock_quantity - quantity) })
                      .eq('id', variantId);
                  }
                });
              }
            }
          }
        }

        // 3. Send transactional confirmation email via Resend
        if (customerEmail && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_mock_key') {
          try {
            await resend.emails.send({
              from: 'Veiled Canvas <orders@veiledcanvas.com>',
              to: customerEmail,
              subject: 'Your Veiled Canvas Order Confirmation',
              html: `
                <div style="font-family: sans-serif; color: #2B2B2B; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h1 style="color: #D4AF37; margin-bottom: 8px;">Order Confirmed</h1>
                  <p>Thank you for your purchase with Veiled Canvas. Your order is being prepared with elegance and care.</p>
                  <div style="background: #FDFBF7; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">Order Reference: ${session.id.slice(0, 16)}...</p>
                    <p style="margin: 4px 0 0 0;">Total Amount: $${(totalAmount / 100).toFixed(2)} USD</p>
                  </div>
                  <p style="font-size: 13px; color: #777;">You will receive another update when your package is dispatched with tracking information.</p>
                </div>
              `,
            });
          } catch (emailErr) {
            console.warn('Resend email failed:', emailErr);
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;

        if (paymentIntentId && supabase) {
          // Transition order to cancelled
          const { data: updatedOrder } = await (supabase as any)
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('stripe_payment_intent', paymentIntentId)
            .select('id')
            .single();

          if (updatedOrder) {
            // Restore inventory stock for refunded order items
            const { data: items } = await (supabase as any)
              .from('order_items')
              .select('variant_id, quantity')
              .eq('order_id', updatedOrder.id);

            if (items) {
              for (const it of items) {
                const { data: v } = await (supabase as any)
                  .from('product_variants')
                  .select('stock_quantity')
                  .eq('id', it.variant_id)
                  .single();
                if (v) {
                  await (supabase as any)
                    .from('product_variants')
                    .update({ stock_quantity: v.stock_quantity + it.quantity })
                    .eq('id', it.variant_id);
                }
              }
            }
          }
        }
        break;
      }

      default:
        // Other events ignored
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling Stripe webhook event:', error);
    return NextResponse.json(
      { error: 'Webhook handler encountered an error' },
      { status: 500 }
    );
  }
}
