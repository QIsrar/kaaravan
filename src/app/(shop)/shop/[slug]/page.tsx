'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Minus, Plus, ShoppingBag, Heart, Share2, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* Mock product data — in production fetched via server component + generateStaticParams */
const allProducts: Record<string, {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  categoryName: string;
  variants: Array<{
    id: string;
    colorName: string;
    colorHex: string;
    sku: string;
    stockQuantity: number;
    additionalPrice: number;
  }>;
}> = {
  'premium-chiffon-hijab': {
    id: 'b1b2c3d4-0001-4000-8000-000000000001',
    title: 'Premium Chiffon Hijab',
    slug: 'premium-chiffon-hijab',
    description: 'Lightweight and breathable chiffon hijab with a soft, flowing drape. Perfect for daily wear and elegant occasions. Features a delicate hand-finished edge for a polished look.',
    basePrice: 2499,
    rating: 5,
    reviewCount: 3,
    categoryName: 'Hijabs & Scarves',
    variants: [
      { id: 'c1000001-0001', colorName: 'Dusty Rose', colorHex: '#D4A0A0', sku: 'CHF-DR-001', stockQuantity: 45, additionalPrice: 0 },
      { id: 'c1000001-0002', colorName: 'Sage Green', colorHex: '#9CAF88', sku: 'CHF-SG-001', stockQuantity: 32, additionalPrice: 0 },
      { id: 'c1000001-0003', colorName: 'Ivory', colorHex: '#FFFFF0', sku: 'CHF-IV-001', stockQuantity: 58, additionalPrice: 0 },
      { id: 'c1000001-0004', colorName: 'Deep Plum', colorHex: '#4A0E2E', sku: 'CHF-DP-001', stockQuantity: 27, additionalPrice: 200 },
    ],
  },
  'classic-black-abaya': {
    id: 'b1b2c3d4-0005-4000-8000-000000000001',
    title: 'Classic Black Abaya',
    slug: 'classic-black-abaya',
    description: 'Timeless black abaya with contemporary tailoring. Features elegant bell sleeves and a subtle A-line silhouette. Made from premium crepe fabric.',
    basePrice: 8999,
    rating: 5,
    reviewCount: 1,
    categoryName: 'Abayas & Dresses',
    variants: [
      { id: 'c1000005-0001', colorName: 'Classic Black', colorHex: '#0A0A0A', sku: 'ABA-CB-001', stockQuantity: 30, additionalPrice: 0 },
      { id: 'c1000005-0002', colorName: 'Charcoal', colorHex: '#333333', sku: 'ABA-CH-001', stockQuantity: 18, additionalPrice: 500 },
    ],
  },
  'sport-hijab-pro': {
    id: 'b1b2c3d4-0010-4000-8000-000000000001',
    title: 'Sport Hijab Pro',
    slug: 'sport-hijab-pro',
    description: 'Engineered for athletes. Moisture-wicking, anti-slip sport hijab with mesh ventilation zones and a secure pull-on fit.',
    basePrice: 2999,
    rating: 5,
    reviewCount: 2,
    categoryName: 'Modest Sportswear',
    variants: [
      { id: 'c1000010-0001', colorName: 'Jet Black', colorHex: '#0D0D0D', sku: 'SPH-JB-001', stockQuantity: 90, additionalPrice: 0 },
      { id: 'c1000010-0002', colorName: 'Storm Grey', colorHex: '#708090', sku: 'SPH-SG-001', stockQuantity: 60, additionalPrice: 0 },
      { id: 'c1000010-0003', colorName: 'Teal', colorHex: '#008080', sku: 'SPH-TL-001', stockQuantity: 45, additionalPrice: 0 },
    ],
  },
};

/* Default fallback for any slug not in the mock data */
function getProduct(slug: string) {
  return allProducts[slug] || allProducts['premium-chiffon-hijab'];
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  // We use a client component for interactivity; in production this would be a server component wrapper
  const [resolvedParams, setResolvedParams] = useState<{ slug: string } | null>(null);

  // Use React.use() pattern — but since this is client, we'll handle it differently
  // For the static mock data approach, we extract slug from URL
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || 'premium-chiffon-hijab' : 'premium-chiffon-hijab';
  const product = getProduct(slug);

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const variant = product.variants[selectedVariantIdx];
  const totalPrice = product.basePrice + variant.additionalPrice;
  const inStock = variant.stockQuantity > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    
    const item: CartItem = {
      variantId: variant.id,
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      sku: variant.sku,
      unitPrice: totalPrice,
      quantity,
      maxQuantity: variant.stockQuantity,
      image: '',
    };

    addItem(item);
    toast.success(`${product.title} added to cart!`);
    openCart();
  };

  return (
    <div className="pt-20 lg:pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main image */}
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4 overflow-hidden">
              <motion.div
                key={selectedVariantIdx}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-48 h-48 rounded-full opacity-30"
                style={{ backgroundColor: variant.colorHex }}
              />
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {product.variants.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVariantIdx(i); setQuantity(1); }}
                  className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all ${
                    i === selectedVariantIdx
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'bg-muted hover:ring-1 ring-border'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: v.colorHex }}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Badge variant="secondary" className="mb-3">{product.categoryName}</Badge>
            
            <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-3">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < product.rating ? 'fill-gold text-gold' : 'text-border'}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-heading text-3xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </span>
              {variant.additionalPrice > 0 && (
                <span className="text-sm text-muted-foreground">
                  (base: {formatPrice(product.basePrice)})
                </span>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              {product.description}
            </p>

            <Separator className="my-6" />

            {/* Color selector */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">
                Color: <span className="text-primary">{variant.colorName}</span>
              </h3>
              <div className="flex gap-3">
                {product.variants.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariantIdx(i); setQuantity(1); }}
                    className={`relative w-10 h-10 rounded-full transition-all ${
                      i === selectedVariantIdx
                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: v.colorHex }}
                    title={v.colorName}
                  >
                    {i === selectedVariantIdx && (
                      <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* SKU & Stock */}
            <div className="flex items-center gap-4 text-sm mb-6">
              <span className="text-muted-foreground">SKU: {variant.sku}</span>
              <span className={inStock ? 'text-green-600' : 'text-destructive'}>
                {inStock ? `${variant.stockQuantity} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="font-medium text-lg w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(variant.stockQuantity, quantity + 1))}
                  disabled={quantity >= variant.stockQuantity}
                  className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="flex-1 gradient-gold text-espresso font-semibold h-13 text-base"
                size="lg"
              >
                <ShoppingBag size={18} className="mr-2" />
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button variant="outline" size="lg" className="h-13 w-13">
                <Heart size={18} />
              </Button>
              <Button variant="outline" size="lg" className="h-13 w-13">
                <Share2 size={18} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: 'Free Shipping', sub: 'Orders over $50' },
                { icon: Shield, label: 'Secure Pay', sub: '256-bit SSL' },
                { icon: RotateCcw, label: 'Easy Returns', sub: '30-day policy' },
              ].map((feature) => (
                <div key={feature.label} className="text-center p-3 rounded-xl bg-muted/50">
                  <feature.icon size={20} className="mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium">{feature.label}</p>
                  <p className="text-[10px] text-muted-foreground">{feature.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
