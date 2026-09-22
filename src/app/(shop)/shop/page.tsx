'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, SlidersHorizontal, X, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useUIStore } from '@/stores/ui-store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useWishlistStore } from '@/stores/wishlist-store';

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
    image: '/images/collection_hijabs.jpg',
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
    image: '/images/prod_modal_silk.jpg',
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
    image: '/images/hero_dummy.jpg',
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
    image: '/images/collection_abayas.jpg',
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
    image: '/images/prod_kimono_abaya.jpg',
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
    image: '/images/prod_maxi_dress.jpg',
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
    image: '/images/collection_sportswear.jpg',
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
    image: '/images/collection_accessories.jpg',
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
    image: '/images/prod_swimwear.jpg',
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
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleItem } = useWishlistStore();
  const isWishlisted = isInWishlist(product.slug);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useUIStore((s) => s.openCart);
  const firstVariant = product.variants[0];

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to save items to your wishlist', { icon: '🔒' });
      router.push(`/login?redirect=${encodeURIComponent('/shop')}`);
      return;
    }

    const added = toggleItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.basePrice,
      image: product.image,
      categoryName: product.categorySlug,
    });

    if (added) {
      toast.success(`${product.title} added to wishlist ❤️`);
    } else {
      toast(`${product.title} removed from wishlist`, { icon: '🤍' });
    }
  };

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
      image: product.image,
    };

    addItem(item);
    toast.success(`${product.title} added to cart`);
    openCart();
  };

  return (
    <Link href={`/shop/${product.slug}`}>
      <Card className="group hover-lift border-2 border-border/80 hover:border-primary/60 rounded-2xl shadow-xs transition-all duration-300 overflow-hidden cursor-pointer h-full relative">
        {/* Image area */}
        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {/* Badge */}
          {product.badge && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-medium">
              {product.badge}
            </Badge>
          )}

          {/* Floating Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md backdrop-blur-md z-10 ${
              isWishlisted
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800'
                : 'bg-black/30 hover:bg-black/60 text-white border border-white/20'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Wishlist"
          >
            <Heart
              size={15}
              className={`transition-transform duration-200 active:scale-125 ${
                isWishlisted ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Quick add desktop hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="hidden sm:block absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              onClick={handleQuickAdd}
              className="w-full gradient-gold text-espresso font-semibold cursor-pointer"
              size="sm"
            >
              <ShoppingBag size={14} className="mr-2" />
              Quick Add
            </Button>
          </motion.div>

          {/* Quick add mobile 1-tap button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className="sm:hidden absolute bottom-2 right-2 w-8 h-8 rounded-full bg-card/90 backdrop-blur-md shadow-md flex items-center justify-center text-espresso hover:scale-110 active:scale-95 transition-transform border border-border/50 cursor-pointer"
            title="Quick add to cart"
          >
            <ShoppingBag size={14} className="text-primary" />
          </button>
        </div>

        <CardContent className="p-3 sm:p-4">
          {/* Color swatches */}
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {product.variants.slice(0, 4).map((v) => (
              <div
                key={v.id}
                className="w-4 h-4 rounded-full border border-black/30 dark:border-white/30 shadow-xs"
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
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';

  const [storeProducts, setStoreProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [showFilters, setShowFilters] = useState(false);

  // Sync with live products API
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products && data.products.length > 0) {
          const mapped = data.products.map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            basePrice: p.base_price,
            rating: p.rating || 5,
            reviewCount: p.review_count || 1,
            categorySlug: p.category,
            image: p.image || '/images/collection_hijabs.jpg',
            variants: (p.variants || []).map((v: any) => ({
              id: v.id,
              colorName: v.color_name,
              colorHex: v.color_hex,
              sku: v.sku,
              stockQuantity: v.stock_quantity,
              additionalPrice: v.additional_price,
              images: v.images || [],
            })),
            badge: p.badge,
          }));
          setStoreProducts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Sync state whenever URL parameters change (e.g. from navbar popular searches or drawer)
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  const filteredProducts = useMemo(() => {
    return storeProducts.filter((p) => {
      if (selectedCategory && p.categorySlug !== selectedCategory) return false;
      if (selectedRating && p.rating < selectedRating) return false;
      if (selectedPriceRange !== null) {
        const range = priceRanges[selectedPriceRange];
        if (p.basePrice < range.min || p.basePrice >= range.max) return false;
      }
      if (searchQuery.trim()) {
        const terms = searchQuery.toLowerCase().trim().split(/\s+/);
        const searchableText = [
          p.title,
          p.categorySlug,
          p.badge || '',
          ...p.variants.map((v) => `${v.colorName} ${v.sku}`),
        ].join(' ').toLowerCase();

        // Check if any word in the search query matches
        const matches = terms.some((term) => searchableText.includes(term));
        if (!matches) return false;
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
      {/* Header with bold border */}
      <div className="bg-muted/30 py-10 border-b-2 border-border/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl lg:text-4xl font-bold mb-2">
            Shop Our Collection
          </h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            {selectedCategory && ` in ${categories.find(c => c.slug === selectedCategory)?.name}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-2 border-border/80"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            Filters
            {hasFilters && (
              <Badge variant="secondary" className="ml-2">Active</Badge>
            )}
          </Button>
        </div>

        <div className="flex gap-8 items-start">
          {/* Sidebar Filters with clear outline border */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-64 shrink-0 space-y-6 bg-card p-5 sm:p-6 rounded-2xl border-2 border-border/80 shadow-xs mb-6 lg:mb-0 sticky top-24`}
          >
            {/* Mobile Filter Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border lg:hidden">
              <span className="font-heading font-bold text-base flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-primary" /> Filter Products
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setShowFilters(false)}
              >
                <X size={18} />
              </Button>
            </div>

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

            <Separator />

            {/* Action buttons (Apply Filter on Mobile before Clear Filter) */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={() => {
                  setShowFilters(false);
                  toast.success(`Filters applied! Showing ${filteredProducts.length} items`);
                }}
                className="w-full gradient-gold text-espresso font-semibold h-10 shadow-sm cursor-pointer lg:hidden flex items-center justify-center gap-2"
              >
                <SlidersHorizontal size={15} />
                Apply Filter ({filteredProducts.length})
              </Button>

              {hasFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full text-sm text-muted-foreground hover:text-foreground h-10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X size={14} />
                  Clear All Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border-2 border-dashed border-border/80 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <Search size={24} />
                </div>
                <p className="font-heading text-xl font-bold mb-2">No matching products found</p>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  {searchQuery ? `We could not find any pieces matching "${searchQuery}".` : 'No products match the selected filter combination.'}
                  {' '}Try clearing your search or exploring our full collection.
                </p>
                <Button variant="outline" onClick={clearFilters} className="border-2 border-border/80 hover:bg-muted font-medium">
                  <X size={14} className="mr-1.5" /> Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
