'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);
  const { isAuthenticated, loading } = useAuth();

  const handleAddToCart = (item: any) => {
    const cartItem: CartItem = {
      variantId: `${item.id}-default`,
      productId: item.id,
      productTitle: item.title,
      productSlug: item.slug,
      colorName: 'Standard',
      colorHex: '#C5A059',
      sku: `VC-${item.slug.slice(0, 4).toUpperCase()}`,
      unitPrice: item.price,
      quantity: 1,
      maxQuantity: 20,
      image: item.image,
    };

    addItem(cartItem);
    toast.success(`${item.title} added to bag!`);
    openCart();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-card/60 backdrop-blur border border-border/80 shadow-xl">
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-espresso mx-auto mb-4 shadow-lg">
            <Heart size={32} />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            Your Atelier Wishlist
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Please sign in or create an account to view, save, and sync your favorite modest couture pieces across all your devices.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full gradient-gold text-espresso font-semibold">
              <Link href="/login?redirect=/wishlist">
                Sign In to View Wishlist <ArrowRight size={16} className="ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup?redirect=/wishlist">
                Create an Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center px-4">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-card/60 backdrop-blur border border-border/80 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-4">
            <Heart size={30} />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            Your Wishlist is Empty
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            You haven't saved any items to your wishlist yet. Tap the heart icon on any piece while exploring to curate your personal collection.
          </p>
          <Button asChild className="gradient-gold text-espresso font-semibold">
            <Link href="/shop">
              Explore New Arrivals <ArrowRight size={16} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 border-b border-border/60 pb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold block mb-1">
              Curated Wardrobe
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              My Saved Pieces ({items.length})
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearWishlist}
            className="text-xs text-muted-foreground hover:text-destructive shrink-0"
          >
            Clear Wishlist
          </Button>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card
              key={item.slug || item.id}
              className="group overflow-hidden border-border/70 bg-card hover-lift flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <button
                    onClick={() => {
                      removeItem(item.slug || item.id);
                      toast('Removed from wishlist', { icon: '🤍' });
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <CardContent className="p-4">
                  {item.categoryName && (
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block mb-1">
                      {item.categoryName}
                    </span>
                  )}
                  <Link
                    href={`/shop/${item.slug}`}
                    className="font-heading font-semibold text-base text-foreground hover:text-primary transition-colors line-clamp-1 block mb-1"
                  >
                    {item.title}
                  </Link>
                  <p className="font-bold text-foreground text-sm">
                    {formatPrice(item.price)}
                  </p>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Button
                  onClick={() => handleAddToCart(item)}
                  className="w-full gradient-gold text-espresso font-semibold"
                  size="sm"
                >
                  <ShoppingBag size={14} className="mr-2" />
                  Move to Bag
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
