'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

/* ============================================================================
   Mock data — In production, this comes from Supabase via server components
   ============================================================================ */
const categories = [
  { name: 'All Products', slug: '' },
  { name: 'Hijabs & Scarves', slug: 'hijabs-scarves' },
  { name: 'Abayas & Dresses', slug: 'abayas-dresses' },
  { name: 'Modest Sportswear', slug: 'modest-sportswear' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'New Arrivals', slug: 'new-arrivals' },
];

const priceRanges = [
  { label: 'Under $25', min: 0, max: 2500 },
  { label: '$25 - $50', min: 2500, max: 5000 },
  { label: '$50 - $100', min: 5000, max: 10000 },
  { label: 'Over $100', min: 10000, max: Infinity },
];

const products = [
  {
    id: 'b1b2c3d4-0001-4000-8000-000000000001',
    title: 'Premium Chiffon Hijab',
    slug: 'premium-chiffon-hijab',
    basePrice: 2499,
    rating: 5,
    reviewCount: 3,
    categorySlug: 'hijabs-scarves',
    variants: [
      { id: 'c1000001-0001', colorName: 'Dusty Rose', colorHex: '#D4A0A0', sku: 'CHF-DR-001', stockQuantity: 45, additionalPrice: 0, images: [] },
      { id: 'c1000001-0002', colorName: 'Sage Green', colorHex: '#9CAF88', sku: 'CHF-SG-001', stockQuantity: 32, additionalPrice: 0, images: [] },
      { id: 'c1000001-0003', colorName: 'Ivory', colorHex: '#FFFFF0', sku: 'CHF-IV-001', stockQuantity: 58, additionalPrice: 0, images: [] },
      { id: 'c1000001-0004', colorName: 'Deep Plum', colorHex: '#4A0E2E', sku: 'CHF-DP-001', stockQuantity: 27, additionalPrice: 200, images: [] },
    ],
    badge: 'Bestseller',
  },
  {
    id: 'b1b2c3d4-0002-4000-8000-000000000001',
    title: 'Jersey Cotton Hijab',
    slug: 'jersey-cotton-hijab',
    basePrice: 1999,
    rating: 5,
    reviewCount: 2,
    categorySlug: 'hijabs-scarves',
    variants: [
      { id: 'c1000002-0001', colorName: 'Black', colorHex: '#1A1A1A', sku: 'JCH-BK-001', stockQuantity: 120, additionalPrice: 0, images: [] },
      { id: 'c1000002-0002', colorName: 'Navy', colorHex: '#1B2A4A', sku: 'JCH-NV-001', stockQuantity: 85, additionalPrice: 0, images: [] },
      { id: 'c1000002-0003', colorName: 'Mauve', colorHex: '#C9A0DC', sku: 'JCH-MV-001', stockQuantity: 40, additionalPrice: 0, images: [] },
      { id: 'c1000002-0004', colorName: 'Camel', colorHex: '#C19A6B', sku: 'JCH-CM-001', stockQuantity: 65, additionalPrice: 0, images: [] },
    ],
  },
  {
    id: 'b1b2c3d4-0003-4000-8000-000000000001',
    title: 'Silk Blend Wrap',
    slug: 'silk-blend-wrap',
    basePrice: 4999,
    rating: 5,
    reviewCount: 1,
    categorySlug: 'hijabs-scarves',
    variants: [
      { id: 'c1000003-0001', colorName: 'Champagne Gold', colorHex: '#F7E7CE', sku: 'SBW-CG-001', stockQuantity: 20, additionalPrice: 0, images: [] },
      { id: 'c1000003-0002', colorName: 'Midnight Blue', colorHex: '#191970', sku: 'SBW-MB-001', stockQuantity: 15, additionalPrice: 0, images: [] },
    ],
    badge: 'Premium',
  },
  {
    id: 'b1b2c3d4-0005-4000-8000-000000000001',
    title: 'Classic Black Abaya',
    slug: 'classic-black-abaya',
    basePrice: 8999,
    rating: 5,
    reviewCount: 1,
    categorySlug: 'abayas-dresses',
    variants: [
      { id: 'c1000005-0001', colorName: 'Classic Black', colorHex: '#0A0A0A', sku: 'ABA-CB-001', stockQuantity: 30, additionalPrice: 0, images: [] },
      { id: 'c1000005-0002', colorName: 'Charcoal', colorHex: '#333333', sku: 'ABA-CH-001', stockQuantity: 18, additionalPrice: 500, images: [] },
    ],
    badge: 'Bestseller',
  },
  {
    id: 'b1b2c3d4-0006-4000-8000-000000000001',
    title: 'Embroidered Kimono Dress',
    slug: 'embroidered-kimono-dress',
    basePrice: 12999,
    rating: 4,
    reviewCount: 2,
    categorySlug: 'abayas-dresses',
    variants: [
      { id: 'c1000006-0001', colorName: 'Emerald', colorHex: '#2E6B4E', sku: 'KMD-EM-001', stockQuantity: 12, additionalPrice: 0, images: [] },
      { id: 'c1000006-0002', colorName: 'Burgundy', colorHex: '#722F37', sku: 'KMD-BG-001', stockQuantity: 8, additionalPrice: 0, images: [] },
    ],
    badge: 'New',
  },
  {
    id: 'b1b2c3d4-0007-4000-8000-000000000001',
    title: 'Everyday Maxi Dress',
    slug: 'everyday-maxi-dress',
    basePrice: 5999,
    rating: 4,
    reviewCount: 1,
    categorySlug: 'abayas-dresses',
    variants: [
      { id: 'c1000007-0001', colorName: 'Dusty Blue', colorHex: '#6E8FAE', sku: 'MXD-DB-001', stockQuantity: 40, additionalPrice: 0, images: [] },
      { id: 'c1000007-0002', colorName: 'Sand', colorHex: '#D2B48C', sku: 'MXD-SD-001', stockQuantity: 55, additionalPrice: 0, images: [] },
      { id: 'c1000007-0003', colorName: 'Rust', colorHex: '#B7410E', sku: 'MXD-RS-001', stockQuantity: 28, additionalPrice: 0, images: [] },
    ],
  },
  {
    id: 'b1b2c3d4-0010-4000-8000-000000000001',
    title: 'Sport Hijab Pro',
    slug: 'sport-hijab-pro',
    basePrice: 2999,
    rating: 5,
    reviewCount: 2,
    categorySlug: 'modest-sportswear',
    variants: [
      { id: 'c1000010-0001', colorName: 'Jet Black', colorHex: '#0D0D0D', sku: 'SPH-JB-001', stockQuantity: 90, additionalPrice: 0, images: [] },
      { id: 'c1000010-0002', colorName: 'Storm Grey', colorHex: '#708090', sku: 'SPH-SG-001', stockQuantity: 60, additionalPrice: 0, images: [] },
      { id: 'c1000010-0003', colorName: 'Teal', colorHex: '#008080', sku: 'SPH-TL-001', stockQuantity: 45, additionalPrice: 0, images: [] },
    ],
    badge: 'Trending',
  },
  {
    id: 'b1b2c3d4-0012-4000-8000-000000000001',
    title: 'Magnetic Hijab Pins Set',
    slug: 'magnetic-hijab-pins-set',
    basePrice: 1499,
    rating: 5,
    reviewCount: 1,
    categorySlug: 'accessories',
    variants: [
      { id: 'c1000012-0001', colorName: 'Gold', colorHex: '#D4AF37', sku: 'MHP-GD-001', stockQuantity: 200, additionalPrice: 0, images: [] },
      { id: 'c1000012-0002', colorName: 'Silver', colorHex: '#C0C0C0', sku: 'MHP-SV-001', stockQuantity: 180, additionalPrice: 0, images: [] },
      { id: 'c1000012-0003', colorName: 'Rose Gold', colorHex: '#B76E79', sku: 'MHP-RG-001', stockQuantity: 150, additionalPrice: 200, images: [] },
    ],
  },
  {
    id: 'b1b2c3d4-0009-4000-8000-000000000001',
    title: 'Performance Swim Set',
    slug: 'performance-swim-set',
    basePrice: 6999,
    rating: 4,
    reviewCount: 1,
    categorySlug: 'modest-sportswear',
    variants: [
      { id: 'c1000009-0001', colorName: 'Ocean Blue', colorHex: '#0077BE', sku: 'SWM-OB-001', stockQuantity: 35, additionalPrice: 0, images: [] },
      { id: 'c1000009-0002', colorName: 'Coral', colorHex: '#FF6B6B', sku: 'SWM-CR-001', stockQuantity: 28, additionalPrice: 0, images: [] },
    ],
    badge: 'New',
  },
];

/* ============================================================================
   Product Card
   ============================================================================ */
function ProductCard({ product }: { product: typeof products[0] }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);
  const firstVariant = product.variants[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const item: CartItem = {
      variantId: firstVariant.id,
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      colorName: firstVariant.colorName,
      colorHex: firstVariant.colorHex,
      sku: firstVariant.sku,
      unitPrice: product.basePrice + firstVariant.additionalPrice,
      quantity: 1,
      maxQuantity: firstVariant.stockQuantity,
      image: '',
    };

    addItem(item);
    toast.success(`${product.title} added to cart`);
    openCart();
  };

  return (
    <Link href={`/shop/${product.slug}`}>
      <Card className="group hover-lift border-0 overflow-hidden cursor-pointer h-full">
        {/* Image area */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500"
              style={{ backgroundColor: firstVariant.colorHex }}
            />
          </div>

          {/* Badge */}
          {product.badge && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-medium">
              {product.badge}
            </Badge>
          )}

          {/* Quick add */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              onClick={handleQuickAdd}
              className="w-full gradient-gold text-espresso font-semibold"
              size="sm"
            >
              <ShoppingBag size={14} className="mr-2" />
              Quick Add
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-4">
          {/* Color swatches */}
          <div className="flex items-center gap-1.5 mb-2">
            {product.variants.slice(0, 4).map((v) => (
              <div
                key={v.id}
                className="w-4 h-4 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: v.colorHex }}
                title={v.colorName}
              />
            ))}
            {product.variants.length > 4 && (
              <span className="text-[10px] text-muted-foreground ml-1">
                +{product.variants.length - 4}
              </span>
            )}
          </div>

          <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={
                  i < product.rating
                    ? 'fill-gold text-gold'
                    : 'text-border'
                }
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <p className="font-heading font-bold text-primary mt-2">
            {formatPrice(product.basePrice)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

/* ============================================================================
   Shop Page
   ============================================================================ */
function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.categorySlug !== selectedCategory) return false;
      if (selectedRating && p.rating < selectedRating) return false;
      if (selectedPriceRange !== null) {
        const range = priceRanges[selectedPriceRange];
        if (p.basePrice < range.min || p.basePrice >= range.max) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedPriceRange, selectedRating, searchQuery]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setSearchQuery('');
  };

  const hasFilters = selectedCategory || selectedPriceRange !== null || selectedRating || searchQuery;

  return (
    <div className="pt-20 lg:pt-24">
      {/* Header */}
      <div className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-2">
            Shop Our Collection
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} products
            {selectedCategory && ` in ${categories.find(c => c.slug === selectedCategory)?.name}`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            Filters
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-64 shrink-0 space-y-6`}
          >
            {/* Search */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Search</h3>
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Categories</h3>
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.slug
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Price Range</h3>
              <div className="space-y-1.5">
                {priceRanges.map((range, i) => (
                  <button
                    key={range.label}
                    onClick={() => setSelectedPriceRange(selectedPriceRange === i ? null : i)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedPriceRange === i
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rating */}
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3">Minimum Rating</h3>
              <div className="space-y-1.5">
                {[5, 4, 3].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedRating === rating
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} size={12} className="fill-current" />
                      ))}
                    </div>
                    <span>& up</span>
                  </button>
                ))}
              </div>
            </div>

            {hasFilters && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full text-sm text-muted-foreground"
                >
                  <X size={14} className="mr-2" />
                  Clear All Filters
                </Button>
              </>
            )}
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-heading text-xl mb-2">No products found</p>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted-foreground">Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
