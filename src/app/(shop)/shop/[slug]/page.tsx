'use client';

import { useState } from 'react';
import Image from 'next/image';
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

function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }
  return false;
}

/* Mock product data — with tailor dummy & modest mannequin still-life photos */
const allProducts: Record<string, {
  id: string;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  rating: number;
  reviewCount: number;
  categoryName: string;
  images: string[];
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
    description: 'Lightweight and breathable chiffon hijab draped on a couture mannequin bust. Soft flowing silhouette with a delicate hand-finished edge for a polished, modest presentation.',
    basePrice: 2499,
    rating: 5,
    reviewCount: 3,
    categoryName: 'Hijabs & Scarves',
    images: ['/images/collection_hijabs.jpg', '/images/prod_modal_silk.jpg'],
    variants: [
      { id: 'c1000001-0001', colorName: 'Dusty Rose', colorHex: '#D4A0A0', sku: 'CHF-DR-001', stockQuantity: 45, additionalPrice: 0 },
      { id: 'c1000001-0002', colorName: 'Sage Green', colorHex: '#9CAF88', sku: 'CHF-SG-001', stockQuantity: 32, additionalPrice: 0 },
      { id: 'c1000001-0003', colorName: 'Ivory', colorHex: '#FFFFF0', sku: 'CHF-IV-001', stockQuantity: 58, additionalPrice: 0 },
      { id: 'c1000001-0004', colorName: 'Deep Plum', colorHex: '#4A0E2E', sku: 'CHF-DP-001', stockQuantity: 27, additionalPrice: 200 },
    ],
  },
  'jersey-cotton-hijab': {
    id: 'b1b2c3d4-0002-4000-8000-000000000001',
    title: 'Jersey Cotton Hijab',
    slug: 'jersey-cotton-hijab',
    description: 'Ultra-soft jersey cotton hijab styled seamlessly on bust form. Stretchy, comfortable, and stays in place without pins.',
    basePrice: 1999,
    rating: 5,
    reviewCount: 2,
    categoryName: 'Hijabs & Scarves',
    images: ['/images/prod_modal_silk.jpg', '/images/collection_hijabs.jpg'],
    variants: [
      { id: 'c1000002-0001', colorName: 'Black', colorHex: '#1A1A1A', sku: 'JCH-BK-001', stockQuantity: 120, additionalPrice: 0 },
      { id: 'c1000002-0002', colorName: 'Navy', colorHex: '#1B2A4A', sku: 'JCH-NV-001', stockQuantity: 85, additionalPrice: 0 },
      { id: 'c1000002-0003', colorName: 'Mauve', colorHex: '#C9A0DC', sku: 'JCH-MV-001', stockQuantity: 40, additionalPrice: 0 },
      { id: 'c1000002-0004', colorName: 'Camel', colorHex: '#C19A6B', sku: 'JCH-CM-001', stockQuantity: 65, additionalPrice: 0 },
    ],
  },
  'silk-blend-wrap': {
    id: 'b1b2c3d4-0003-4000-8000-000000000001',
    title: 'Silk Blend Wrap',
    slug: 'silk-blend-wrap',
    description: 'Luxurious silk blend wrap with subtle sheen, shown on haute couture wooden tripod tailor mannequin.',
    basePrice: 4999,
    rating: 5,
    reviewCount: 1,
    categoryName: 'Hijabs & Scarves',
    images: ['/images/hero_dummy.jpg', '/images/collection_hijabs.jpg'],
    variants: [
      { id: 'c1000003-0001', colorName: 'Champagne Gold', colorHex: '#F7E7CE', sku: 'SBW-CG-001', stockQuantity: 20, additionalPrice: 0 },
      { id: 'c1000003-0002', colorName: 'Midnight Blue', colorHex: '#191970', sku: 'SBW-MB-001', stockQuantity: 15, additionalPrice: 0 },
    ],
  },
  'classic-black-abaya': {
    id: 'b1b2c3d4-0005-4000-8000-000000000001',
    title: 'Classic Black Abaya',
    slug: 'classic-black-abaya',
    description: 'Timeless black abaya tailored on a bespoke couture dressmaker dummy. Features elegant bell sleeves and a flowing A-line silhouette in premium crepe.',
    basePrice: 8999,
    rating: 5,
    reviewCount: 1,
    categoryName: 'Abayas & Dresses',
    images: ['/images/collection_abayas.jpg', '/images/prod_kimono_abaya.jpg'],
    variants: [
      { id: 'c1000005-0001', colorName: 'Classic Black', colorHex: '#0A0A0A', sku: 'ABA-CB-001', stockQuantity: 30, additionalPrice: 0 },
      { id: 'c1000005-0002', colorName: 'Charcoal', colorHex: '#333333', sku: 'ABA-CH-001', stockQuantity: 18, additionalPrice: 500 },
    ],
  },
  'embroidered-kimono-dress': {
    id: 'b1b2c3d4-0006-4000-8000-000000000001',
    title: 'Embroidered Kimono Dress',
    slug: 'embroidered-kimono-dress',
    description: 'Statement dress with intricate golden filigree embroidery on tailored dress form. Open kimono layering over matching modest inner slip.',
    basePrice: 12999,
    rating: 4,
    reviewCount: 2,
    categoryName: 'Abayas & Dresses',
    images: ['/images/prod_kimono_abaya.jpg', '/images/hero_dummy.jpg'],
    variants: [
      { id: 'c1000006-0001', colorName: 'Emerald', colorHex: '#2E6B4E', sku: 'KMD-EM-001', stockQuantity: 12, additionalPrice: 0 },
      { id: 'c1000006-0002', colorName: 'Burgundy', colorHex: '#722F37', sku: 'KMD-BG-001', stockQuantity: 8, additionalPrice: 0 },
    ],
  },
  'everyday-maxi-dress': {
    id: 'b1b2c3d4-0007-4000-8000-000000000001',
    title: 'Everyday Maxi Dress',
    slug: 'everyday-maxi-dress',
    description: 'Effortlessly modest maxi dress with clean architectural lines on a mannequin form. Breathable fabric and relaxed drape.',
    basePrice: 5999,
    rating: 4,
    reviewCount: 1,
    categoryName: 'Abayas & Dresses',
    images: ['/images/prod_maxi_dress.jpg', '/images/collection_abayas.jpg'],
    variants: [
      { id: 'c1000007-0001', colorName: 'Dusty Blue', colorHex: '#6E8FAE', sku: 'MXD-DB-001', stockQuantity: 40, additionalPrice: 0 },
      { id: 'c1000007-0002', colorName: 'Sand', colorHex: '#D2B48C', sku: 'MXD-SD-001', stockQuantity: 55, additionalPrice: 0 },
      { id: 'c1000007-0003', colorName: 'Rust', colorHex: '#B7410E', sku: 'MXD-RS-001', stockQuantity: 28, additionalPrice: 0 },
    ],
  },
  'sport-hijab-pro': {
    id: 'b1b2c3d4-0010-4000-8000-000000000001',
    title: 'Sport Hijab Pro',
    slug: 'sport-hijab-pro',
    description: 'Engineered for athletes. Moisture-wicking, anti-slip sport hijab on an athletic mannequin bust form with breathable mesh zones.',
    basePrice: 2999,
    rating: 5,
    reviewCount: 2,
    categoryName: 'Modest Sportswear',
    images: ['/images/collection_sportswear.jpg', '/images/prod_swimwear.jpg'],
    variants: [
      { id: 'c1000010-0001', colorName: 'Jet Black', colorHex: '#0D0D0D', sku: 'SPH-JB-001', stockQuantity: 90, additionalPrice: 0 },
      { id: 'c1000010-0002', colorName: 'Storm Grey', colorHex: '#708090', sku: 'SPH-SG-001', stockQuantity: 60, additionalPrice: 0 },
      { id: 'c1000010-0003', colorName: 'Teal', colorHex: '#008080', sku: 'SPH-TL-001', stockQuantity: 45, additionalPrice: 0 },
    ],
  },
  'magnetic-hijab-pins-set': {
    id: 'b1b2c3d4-0012-4000-8000-000000000001',
    title: 'Magnetic Hijab Pins Set',
    slug: 'magnetic-hijab-pins-set',
    description: 'Strong magnetic hijab pins on ivory silk satin backdrop. Snag-free hold that preserves delicate chiffon and modal silks.',
    basePrice: 1499,
    rating: 5,
    reviewCount: 1,
    categoryName: 'Accessories',
    images: ['/images/collection_accessories.jpg'],
    variants: [
      { id: 'c1000012-0001', colorName: 'Gold', colorHex: '#D4AF37', sku: 'MHP-GD-001', stockQuantity: 200, additionalPrice: 0 },
      { id: 'c1000012-0002', colorName: 'Silver', colorHex: '#C0C0C0', sku: 'MHP-SV-001', stockQuantity: 180, additionalPrice: 0 },
      { id: 'c1000012-0003', colorName: 'Rose Gold', colorHex: '#B76E79', sku: 'MHP-RG-001', stockQuantity: 150, additionalPrice: 200 },
    ],
  },
  'performance-swim-set': {
    id: 'b1b2c3d4-0009-4000-8000-000000000001',
    title: 'Performance Swim Set',
    slug: 'performance-swim-set',
    description: 'Full-coverage modest swimwear with UPF 50+ protection, displayed on headless athletic form. Quick-dry and chlorine-resistant.',
    basePrice: 6999,
    rating: 4,
    reviewCount: 1,
    categoryName: 'Modest Sportswear',
    images: ['/images/prod_swimwear.jpg', '/images/collection_sportswear.jpg'],
    variants: [
      { id: 'c1000009-0001', colorName: 'Ocean Blue', colorHex: '#0077BE', sku: 'SWM-OB-001', stockQuantity: 35, additionalPrice: 0 },
      { id: 'c1000009-0002', colorName: 'Coral', colorHex: '#FF6B6B', sku: 'SWM-CR-001', stockQuantity: 28, additionalPrice: 0 },
    ],
  },
};

/* Default fallback for any slug not in the mock data */
function getProduct(slug: string) {
  return allProducts[slug] || allProducts['premium-chiffon-hijab'];
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || 'premium-chiffon-hijab' : 'premium-chiffon-hijab';
  const product = getProduct(slug);

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);

  const variant = product.variants[selectedVariantIdx];
  const totalPrice = product.basePrice + variant.additionalPrice;
  const inStock = variant.stockQuantity > 0;
  const currentImage = product.images[selectedImageIdx] || product.images[0];

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
      image: currentImage,
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

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main image on tailor dummy/mannequin */}
            <div className="relative aspect-square rounded-2xl bg-muted overflow-hidden mb-3 sm:mb-4 shadow-md border border-border/40 group">
              <Image
                src={currentImage}
                alt={`${product.title} on tailor dummy`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                priority
              />
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20">
                  Couture Form Display
                </span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            <div className="flex gap-2 sm:gap-3 mb-4 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIdx(i)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden transition-all border cursor-pointer ${
                    i === selectedImageIdx
                      ? 'ring-2 ring-primary ring-offset-2 border-transparent'
                      : 'opacity-70 hover:opacity-100 border-border/50'
                  }`}
                >
                  <Image src={img} alt={`${product.title} view ${i + 1}`} fill className="object-cover" />
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
                {product.variants.map((v, i) => {
                  const light = isLightColor(v.colorHex);
                  return (
                    <button
                      key={v.id}
                      onClick={() => { setSelectedVariantIdx(i); setQuantity(1); }}
                      className={`relative w-10 h-10 rounded-full transition-all border-2 ${
                        light ? 'border-neutral-500' : 'border-black/20'
                      } ${
                        i === selectedVariantIdx
                          ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-sm'
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                      title={v.colorName}
                    >
                      {i === selectedVariantIdx && (
                        <Check
                          size={16}
                          className={`absolute inset-0 m-auto ${
                            light ? 'text-neutral-900' : 'text-white'
                          } drop-shadow-sm font-bold`}
                        />
                      )}
                    </button>
                  );
                })}
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
