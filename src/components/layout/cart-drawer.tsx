'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

import { useState } from 'react';
import toast from 'react-hot-toast';

export function CartDrawer() {
  const { isCartOpen, closeCart } = useUIStore();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } =
    useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            productTitle: i.productTitle,
            unitPrice: i.unitPrice,
          })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to initialize checkout');
        setIsCheckingOut(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Network error. Please try again.');
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-md bg-background shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-heading text-lg font-semibold">
                  Your Cart
                </h2>
                <span className="text-sm text-muted-foreground">
                  ({items.length} {items.length === 1 ? 'item' : 'items'})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeCart}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </Button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag
                    size={48}
                    className="text-muted-foreground/30 mb-4"
                  />
                  <h3 className="font-heading text-lg font-medium mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Discover our curated collection of modest fashion
                  </p>
                  <Button asChild onClick={closeCart}>
                    <Link href="/shop">
                      Browse Collection
                      <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-4 p-3 rounded-xl bg-muted/50"
                    >
                      {/* Image placeholder */}
                      <div
                        className="w-20 h-20 rounded-lg shrink-0 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${item.colorHex}22, ${item.colorHex}44)`,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: item.colorHex }}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/shop/${item.productSlug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.productTitle}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.colorName} · {item.sku}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(item.unitPrice)}
                        </p>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground disabled:opacity-40 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              disabled={item.quantity >= item.maxQuantity}
                              className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground disabled:opacity-40 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.variantId)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Clear cart */}
                  <button
                    onClick={clearCart}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2"
                  >
                    Clear all items
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-lg font-heading font-bold">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>
                <Separator />
                <Button
                  className="w-full gradient-gold text-espresso font-semibold h-12 text-base"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    'Preparing Checkout...'
                  ) : (
                    <>
                      Proceed to Checkout
                      <ArrowRight size={18} className="ml-2" />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={closeCart}
                  asChild
                >
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
