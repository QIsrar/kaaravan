export interface CatalogVariant {
  id: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: number;
  additional_price: number;
  images?: string[];
}

export interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number; // in cents
  rating: number;
  review_count: number;
  category: string;
  category_name?: string;
  image: string;
  images?: string[];
  badge?: string;
  is_archived: boolean;
  variants: CatalogVariant[];
  created_at: string;
  updated_at: string;
}

// Initial live catalog seeded with real product entries & modest photography
export const initialCatalog: CatalogProduct[] = [
  {
    id: 'prod-001',
    title: 'Premium Chiffon Hijab',
    slug: 'premium-chiffon-hijab',
    description: 'Lightweight and breathable chiffon hijab draped on an atelier tailor bust. Soft flowing silhouette with a delicate hand-finished edge for a polished, modest presentation.',
    base_price: 2499,
    rating: 5,
    review_count: 3,
    category: 'hijabs-scarves',
    category_name: 'Hijabs & Scarves',
    image: '/images/collection_hijabs.jpg',
    images: ['/images/collection_hijabs.jpg', '/images/prod_modal_silk.jpg'],
    badge: 'Bestseller',
    is_archived: false,
    variants: [
      { id: 'var-001-1', color_name: 'Dusty Rose', color_hex: '#D4A0A0', sku: 'CHF-DR-001', stock_quantity: 45, additional_price: 0 },
      { id: 'var-001-2', color_name: 'Sage Green', color_hex: '#9CAF88', sku: 'CHF-SG-001', stock_quantity: 3, additional_price: 0 }, // Low stock
      { id: 'var-001-3', color_name: 'Ivory', color_hex: '#FFFFF0', sku: 'CHF-IV-001', stock_quantity: 0, additional_price: 0 }, // Out of stock
      { id: 'var-001-4', color_name: 'Deep Plum', color_hex: '#4A0E2E', sku: 'CHF-DP-001', stock_quantity: 27, additional_price: 200 },
    ],
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-002',
    title: 'Jersey Cotton Hijab',
    slug: 'jersey-cotton-hijab',
    description: 'Ultra-soft premium cotton jersey with natural four-way stretch. Drapes effortlessly without pins, providing all-day comfort and non-slip security.',
    base_price: 1999,
    rating: 5,
    review_count: 2,
    category: 'hijabs-scarves',
    category_name: 'Hijabs & Scarves',
    image: '/images/prod_modal_silk.jpg',
    images: ['/images/prod_modal_silk.jpg', '/images/collection_hijabs.jpg'],
    is_archived: false,
    variants: [
      { id: 'var-002-1', color_name: 'Black', color_hex: '#1A1A1A', sku: 'JCH-BK-001', stock_quantity: 120, additional_price: 0 },
      { id: 'var-002-2', color_name: 'Navy', color_hex: '#1B2A4A', sku: 'JCH-NV-001', stock_quantity: 85, additional_price: 0 },
      { id: 'var-002-3', color_name: 'Mauve', color_hex: '#C9A0DC', sku: 'JCH-MV-001', stock_quantity: 4, additional_price: 0 }, // Low stock
      { id: 'var-002-4', color_name: 'Camel', color_hex: '#C19A6B', sku: 'JCH-CM-001', stock_quantity: 65, additional_price: 0 },
    ],
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-003',
    title: 'Silk Blend Wrap',
    slug: 'silk-blend-wrap',
    description: 'Opulent silk and modal blend with subtle lustrous sheen. Exceptional breathability and featherlight drape for special ceremonies and formal evenings.',
    base_price: 4999,
    rating: 5,
    review_count: 1,
    category: 'hijabs-scarves',
    category_name: 'Hijabs & Scarves',
    image: '/images/hero_dummy.jpg',
    badge: 'Premium',
    is_archived: false,
    variants: [
      { id: 'var-003-1', color_name: 'Champagne Gold', color_hex: '#F7E7CE', sku: 'SBW-CG-001', stock_quantity: 2, additional_price: 0 }, // Low stock
      { id: 'var-003-2', color_name: 'Midnight Blue', color_hex: '#191970', sku: 'SBW-MB-001', stock_quantity: 15, additional_price: 0 },
    ],
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-004',
    title: 'Classic Black Abaya',
    slug: 'classic-black-abaya',
    description: 'Timeless tailored A-line abaya crafted from premium crepe. Full-length silhouette with concealed snap buttons and subtle matte gold trim detailing along cuffs.',
    base_price: 8999,
    rating: 5,
    review_count: 1,
    category: 'abayas-dresses',
    category_name: 'Abayas & Dresses',
    image: '/images/collection_abayas.jpg',
    badge: 'Bestseller',
    is_archived: false,
    variants: [
      { id: 'var-004-1', color_name: 'Classic Black', color_hex: '#0A0A0A', sku: 'ABA-CB-001', stock_quantity: 30, additional_price: 0 },
      { id: 'var-004-2', color_name: 'Charcoal', color_hex: '#333333', sku: 'ABA-CH-001', stock_quantity: 18, additional_price: 500 },
    ],
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-005',
    title: 'Embroidered Kimono Dress',
    slug: 'embroidered-kimono-dress',
    description: 'Artisan kimono-style open abaya adorned with tonal metallic thread embroidery along the lapels and wide sleeves. Includes a matching self-tie sash belt.',
    base_price: 12999,
    rating: 4,
    review_count: 2,
    category: 'abayas-dresses',
    category_name: 'Abayas & Dresses',
    image: '/images/prod_kimono_abaya.jpg',
    badge: 'New',
    is_archived: false,
    variants: [
      { id: 'var-005-1', color_name: 'Emerald', color_hex: '#2E6B4E', sku: 'KMD-EM-001', stock_quantity: 1, additional_price: 0 }, // Critical stock
      { id: 'var-005-2', color_name: 'Burgundy', color_hex: '#722F37', sku: 'KMD-BG-001', stock_quantity: 8, additional_price: 0 },
    ],
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-006',
    title: 'Everyday Maxi Dress',
    slug: 'everyday-maxi-dress',
    description: 'Effortless tiered maxi dress cut from breathable linen-blend fabric. Features a relaxed high neckline, long blouson sleeves, and deep side-seam pockets.',
    base_price: 5999,
    rating: 4,
    review_count: 1,
    category: 'abayas-dresses',
    category_name: 'Abayas & Dresses',
    image: '/images/prod_maxi_dress.jpg',
    is_archived: false,
    variants: [
      { id: 'var-006-1', color_name: 'Dusty Blue', color_hex: '#6E8FAE', sku: 'MXD-DB-001', stock_quantity: 40, additional_price: 0 },
      { id: 'var-006-2', color_name: 'Sand', color_hex: '#D2B48C', sku: 'MXD-SD-001', stock_quantity: 55, additional_price: 0 },
      { id: 'var-006-3', color_name: 'Rust', color_hex: '#B7410E', sku: 'MXD-RS-001', stock_quantity: 28, additional_price: 0 },
    ],
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-007',
    title: 'Sport Hijab Pro',
    slug: 'sport-hijab-pro',
    description: 'High-performance moisture-wicking athletic hijab engineered with breathable mesh ventilation panels. Stays completely secure during high-intensity training.',
    base_price: 2999,
    rating: 5,
    review_count: 2,
    category: 'modest-sportswear',
    category_name: 'Modest Sportswear',
    image: '/images/collection_sportswear.jpg',
    badge: 'Trending',
    is_archived: false,
    variants: [
      { id: 'var-007-1', color_name: 'Jet Black', color_hex: '#0D0D0D', sku: 'SPH-JB-001', stock_quantity: 90, additional_price: 0 },
      { id: 'var-007-2', color_name: 'Storm Grey', color_hex: '#708090', sku: 'SPH-SG-001', stock_quantity: 60, additional_price: 0 },
      { id: 'var-007-3', color_name: 'Teal', color_hex: '#008080', sku: 'SPH-TL-001', stock_quantity: 5, additional_price: 0 }, // Low stock
    ],
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-008',
    title: 'Magnetic Hijab Pins Set',
    slug: 'magnetic-hijab-pins-set',
    description: 'Set of four ultra-strong neodymium magnetic pins. Securely holds delicate chiffon, silk, and jersey fabrics without snagging or puncturing threads.',
    base_price: 1499,
    rating: 5,
    review_count: 1,
    category: 'accessories',
    category_name: 'Accessories',
    image: '/images/collection_accessories.jpg',
    is_archived: false,
    variants: [
      { id: 'var-008-1', color_name: 'Gold', color_hex: '#D4AF37', sku: 'MHP-GD-001', stock_quantity: 200, additional_price: 0 },
      { id: 'var-008-2', color_name: 'Silver', color_hex: '#C0C0C0', sku: 'MHP-SV-001', stock_quantity: 180, additional_price: 0 },
      { id: 'var-008-3', color_name: 'Rose Gold', color_hex: '#B76E79', sku: 'MHP-RG-001', stock_quantity: 150, additional_price: 200 },
    ],
    created_at: '2026-02-25T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
  {
    id: 'prod-009',
    title: 'Performance Swim Set',
    slug: 'performance-swim-set',
    description: 'UPF 50+ chlorine-resistant three-piece modest swimwear ensemble consisting of a tunic top, swim leggings, and streamlined swim hijab hood.',
    base_price: 6999,
    rating: 4,
    review_count: 1,
    category: 'modest-sportswear',
    category_name: 'Modest Sportswear',
    image: '/images/prod_swimwear.jpg',
    badge: 'New',
    is_archived: false,
    variants: [
      { id: 'var-009-1', color_name: 'Ocean Blue', color_hex: '#0077BE', sku: 'SWM-OB-001', stock_quantity: 35, additional_price: 0 },
      { id: 'var-009-2', color_name: 'Coral', color_hex: '#FF6B6B', sku: 'SWM-CR-001', stock_quantity: 0, additional_price: 0 }, // Out of stock
    ],
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-09-22T20:00:00Z',
  },
];

// Global in-memory singleton for real-time catalog state
declare global {
  var __veiledCanvasCatalog: CatalogProduct[] | undefined;
}

if (!global.__veiledCanvasCatalog) {
  global.__veiledCanvasCatalog = [...initialCatalog];
}

export const catalogStore = {
  getAll: (includeArchived = false): CatalogProduct[] => {
    const list = global.__veiledCanvasCatalog || initialCatalog;
    if (includeArchived) return list;
    return list.filter((p) => !p.is_archived);
  },

  getBySlug: (slug: string): CatalogProduct | undefined => {
    const list = global.__veiledCanvasCatalog || initialCatalog;
    return list.find((p) => p.slug === slug);
  },

  getById: (id: string): CatalogProduct | undefined => {
    const list = global.__veiledCanvasCatalog || initialCatalog;
    return list.find((p) => p.id === id);
  },

  upsert: (product: CatalogProduct): CatalogProduct => {
    if (!global.__veiledCanvasCatalog) {
      global.__veiledCanvasCatalog = [...initialCatalog];
    }
    const idx = global.__veiledCanvasCatalog.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      global.__veiledCanvasCatalog[idx] = {
        ...global.__veiledCanvasCatalog[idx],
        ...product,
        updated_at: new Date().toISOString(),
      };
      return global.__veiledCanvasCatalog[idx];
    } else {
      const newProd = {
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      global.__veiledCanvasCatalog.unshift(newProd);
      return newProd;
    }
  },

  delete: (id: string): boolean => {
    if (!global.__veiledCanvasCatalog) return false;
    const initialLen = global.__veiledCanvasCatalog.length;
    global.__veiledCanvasCatalog = global.__veiledCanvasCatalog.filter((p) => p.id !== id);
    return global.__veiledCanvasCatalog.length < initialLen;
  },

  updateStock: (sku: string, newQuantity: number): boolean => {
    if (!global.__veiledCanvasCatalog) return false;
    for (const prod of global.__veiledCanvasCatalog) {
      for (const v of prod.variants) {
        if (v.sku.toLowerCase() === sku.toLowerCase()) {
          v.stock_quantity = newQuantity;
          prod.updated_at = new Date().toISOString();
          return true;
        }
      }
    }
    return false;
  },

  // Calculate stock alerts sorted strictly from lowest to highest stock
  getStockAlerts: () => {
    const list = global.__veiledCanvasCatalog || initialCatalog;
    const alerts: Array<{
      productTitle: string;
      productSlug: string;
      colorName: string;
      sku: string;
      stockQuantity: number;
      status: 'out_of_stock' | 'critical' | 'low' | 'healthy';
      priority: number; // 1 = highest priority (0 stock), 2 = critical (1-5), 3 = low (6-10)
    }> = [];

    for (const p of list) {
      if (p.is_archived) continue;
      for (const v of p.variants) {
        let status: 'out_of_stock' | 'critical' | 'low' | 'healthy' = 'healthy';
        let priority = 4;

        if (v.stock_quantity === 0) {
          status = 'out_of_stock';
          priority = 1;
        } else if (v.stock_quantity <= 5) {
          status = 'critical';
          priority = 2;
        } else if (v.stock_quantity <= 10) {
          status = 'low';
          priority = 3;
        }

        alerts.push({
          productTitle: p.title,
          productSlug: p.slug,
          colorName: v.color_name,
          sku: v.sku,
          stockQuantity: v.stock_quantity,
          status,
          priority,
        });
      }
    }

    // Sort strictly lowest stock quantity first (0 units first, then 1, 2, 3...)
    alerts.sort((a, b) => a.stockQuantity - b.stockQuantity);
    return alerts;
  },
};
