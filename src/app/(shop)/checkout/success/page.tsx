'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id') || 'VC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const isDemo = searchParams.get('mode') === 'demo' || sessionId.startsWith('demo_');
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Clear cart once checkout is successfully completed
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card rounded-2xl border border-border/80 shadow-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={36} />
        </motion.div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 mb-3">
          <Sparkles size={12} />
          Order Confirmed
        </span>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Thank you for your order!
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          Your order has been received and is being prepared with elegance and care. A confirmation email with tracking details will be sent to you shortly.
        </p>

        {isDemo && (
          <div className="bg-muted/60 rounded-xl p-3 text-xs text-muted-foreground mb-6 border border-border/50">
            <span className="font-semibold text-foreground">Demo Mode:</span> No real card was charged. This simulated order was processed seamlessly.
          </div>
        )}

        <div className="bg-muted/40 rounded-xl p-4 mb-8 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order Reference</span>
            <span className="font-mono font-medium text-foreground">{sessionId.slice(0, 16)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fulfillment Status</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Package size={12} /> Processing
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Delivery</span>
            <span className="font-medium text-foreground">3 – 5 Business Days</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full gradient-gold text-espresso font-semibold h-11">
            <Link href="/shop">
              Continue Shopping
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full h-11">
            <Link href="/">
              <Home size={16} className="mr-2" />
              Return Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading confirmation...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
