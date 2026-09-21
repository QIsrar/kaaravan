'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { XCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card rounded-2xl border border-border/80 shadow-xl p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-6">
          <XCircle size={36} />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Checkout Incomplete
        </h1>

        <p className="text-sm text-muted-foreground mb-8">
          No charges were made. Your selected items are still securely saved in your shopping bag whenever you are ready.
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full gradient-gold text-espresso font-semibold h-11">
            <Link href="/shop">
              <ShoppingBag size={16} className="mr-2" />
              Return to Shop
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full h-11">
            <Link href="/">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
