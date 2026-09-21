'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductFormModal, type ProductFormValues } from '@/components/admin/product-form';
import { formatPrice } from '@/lib/utils';
import {
  Search,
  Plus,
  Edit2,
  Archive,
  RefreshCw,
  ArchiveRestore,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminProductItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  categoryName: string;
  description: string;
  base_price: number;
  is_archived: boolean;
  variants: Array<{
    id: string;
    color_name: string;
    color_hex: string;
    sku: string;
    stock_quantity: number;
    additional_price: number;
  }>;
}

const initialProducts: AdminProductItem[] = [
  {
    id: 'prod_1',
    title: 'Premium Silk Chiffon Hijab',
    slug: 'premium-silk-chiffon-hijab',
    category: 'hijabs-scarves',
    categoryName: 'Hijabs & Scarves',
    description: 'Ultra-soft, lightweight modal with a delicate woven texture and generous 180cm x 70cm dimensions.',
    base_price: 3800,
    is_archived: false,
    variants: [
      { id: 'v1', color_name: 'Dusty Rose', color_hex: '#DCAE96', sku: 'VC-HJB-SILK-ROSE', stock_quantity: 45, additional_price: 0 },
      { id: 'v2', color_name: 'Sage Mist', color_hex: '#9CAF88', sku: 'VC-HJB-SILK-SAGE', stock_quantity: 28, additional_price: 0 },
      { id: 'v3', color_name: 'Emerald Green', color_hex: '#1B4D3E', sku: 'VC-HJB-SILK-EMR', stock_quantity: 2, additional_price: 200 },
    ],
  },
  {
    id: 'prod_2',
    title: 'Minimalist Linen Everyday Abaya',
    slug: 'minimalist-linen-everyday-abaya',
    category: 'abayas-dresses',
    categoryName: 'Abayas & Dresses',
    description: 'Clean silhouette in 100% French washed linen. Breathable, durable, and refined.',
    base_price: 13500,
    is_archived: false,
    variants: [
      { id: 'v4', color_name: 'Oatmeal Beige', color_hex: '#D7C4B7', sku: 'VC-ABY-LIN-OAT', stock_quantity: 18, additional_price: 0 },
      { id: 'v5', color_name: 'Midnight Charcoal', color_hex: '#2E3138', sku: 'VC-ABY-LIN-CHR', stock_quantity: 22, additional_price: 0 },
    ],
  },
  {
    id: 'prod_3',
    title: 'Modal Silk Square Hijab',
    slug: 'modal-silk-square-hijab',
    category: 'hijabs-scarves',
    categoryName: 'Hijabs & Scarves',
    description: 'Generous 110x110cm square hijab with subtle luminous sheen and effortless drape.',
    base_price: 4200,
    is_archived: false,
    variants: [
      { id: 'v6', color_name: 'Pearl Cream', color_hex: '#FDFBF7', sku: 'VC-HJB-MOD-PRL', stock_quantity: 32, additional_price: 0 },
      { id: 'v7', color_name: 'Caramel Taupe', color_hex: '#A07855', sku: 'VC-HJB-MOD-TAU', stock_quantity: 14, additional_price: 0 },
    ],
  },
  {
    id: 'prod_4',
    title: 'Seamless Bamboo Underscarf',
    slug: 'seamless-bamboo-underscarf',
    category: 'accessories',
    categoryName: 'Accessories',
    description: 'Thermo-regulating organic bamboo fiber designed to stay in place without tension.',
    base_price: 2000,
    is_archived: false,
    variants: [
      { id: 'v8', color_name: 'Mocha', color_hex: '#5E4839', sku: 'VC-ACC-UND-MCH', stock_quantity: 4, additional_price: 0 },
      { id: 'v9', color_name: 'Nude Beige', color_hex: '#E3C8B2', sku: 'VC-ACC-UND-NUD', stock_quantity: 48, additional_price: 0 },
      { id: 'v10', color_name: 'Obsidian Black', color_hex: '#1A1A1A', sku: 'VC-ACC-UND-BLK', stock_quantity: 50, additional_price: 0 },
    ],
  },
  {
    id: 'prod_5',
    title: 'Active Modest Performance Tunic',
    slug: 'active-modest-performance-tunic',
    category: 'modest-sportswear',
    categoryName: 'Modest Sportswear',
    description: 'UPF 50+ sweat-wicking tunic with curved modest hem and side-slit vents.',
    base_price: 6800,
    is_archived: false,
    variants: [
      { id: 'v11', color_name: 'Midnight Black', color_hex: '#111111', sku: 'VC-SPT-ACT-BLK', stock_quantity: 19, additional_price: 0 },
      { id: 'v12', color_name: 'Slate Blue', color_hex: '#5C6B73', sku: 'VC-SPT-ACT-BLU', stock_quantity: 11, additional_price: 0 },
    ],
  },
  {
    id: 'prod_6',
    title: 'Pleated Satin Evening Abaya',
    slug: 'pleated-satin-evening-abaya',
    category: 'abayas-dresses',
    categoryName: 'Abayas & Dresses',
    description: 'Fluid accordian pleating along sleeve and hem, tailored for celebratory occasions.',
    base_price: 18900,
    is_archived: true, // Archived demo example
    variants: [
      { id: 'v13', color_name: 'Champagne Gold', color_hex: '#E6C280', sku: 'VC-ABY-SAT-GLD', stock_quantity: 8, additional_price: 0 },
    ],
  },
];

export default function AdminProductsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormValues | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !p.is_archived) ||
      (statusFilter === 'archived' && p.is_archived);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleArchive = (id: string, currentArchived: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_archived: !currentArchived } : p))
    );
    toast.success(
      currentArchived ? 'Product restored to active catalog' : 'Product soft-archived'
    );
  };

  const handleAdjustStock = (productId: string, variantId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) =>
            v.id === variantId
              ? { ...v, stock_quantity: Math.max(0, v.stock_quantity + delta) }
              : v
          ),
        };
      })
    );
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: AdminProductItem) => {
    setEditingProduct({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      category: product.category,
      base_price: product.base_price,
      variants: product.variants.map((v) => ({
        id: v.id,
        color_name: v.color_name,
        color_hex: v.color_hex,
        sku: v.sku,
        stock_quantity: v.stock_quantity,
        additional_price: v.additional_price,
      })),
    });
    setIsFormOpen(true);
  };

  const handleSaveProduct = (formValues: ProductFormValues) => {
    if (formValues.id) {
      // Update
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== formValues.id) return p;
          return {
            ...p,
            title: formValues.title,
            slug: formValues.slug,
            description: formValues.description,
            category: formValues.category,
            base_price: formValues.base_price,
            variants: formValues.variants.map((v, i) => ({
              id: v.id || `v_gen_${Date.now()}_${i}`,
              color_name: v.color_name,
              color_hex: v.color_hex,
              sku: v.sku,
              stock_quantity: v.stock_quantity,
              additional_price: v.additional_price,
            })),
          };
        })
      );
    } else {
      // Create new
      const newProd: AdminProductItem = {
        id: `prod_${Date.now()}`,
        title: formValues.title,
        slug: formValues.slug,
        category: formValues.category,
        categoryName: formValues.category.replace('-', ' ').toUpperCase(),
        description: formValues.description,
        base_price: formValues.base_price,
        is_archived: false,
        variants: formValues.variants.map((v, i) => ({
          id: `v_new_${Date.now()}_${i}`,
          color_name: v.color_name,
          color_hex: v.color_hex,
          sku: v.sku,
          stock_quantity: v.stock_quantity,
          additional_price: v.additional_price,
        })),
      };
      setProducts((prev) => [newProd, ...prev]);
    }
  };

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Catalog & Inventory"
        subtitle="Manage modest fashion items, color variants, SKU stocks, and soft archive"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Actions & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, slug, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36 h-10 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hijabs-scarves">Hijabs</SelectItem>
                <SelectItem value="abayas-dresses">Abayas</SelectItem>
                <SelectItem value="modest-sportswear">Sportswear</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-32 h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({products.length})</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="gradient-gold text-espresso font-semibold h-10 shrink-0 gap-1.5"
          >
            <Plus size={16} />
            Add New Product
          </Button>
        </div>

        {/* Products Grid / Cards */}
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground border-border/80">
              No products found matching the current search & filters.
            </Card>
          ) : (
            filteredProducts.map((product) => {
              const totalStock = product.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
              const hasLowStock = product.variants.some((v) => v.stock_quantity <= 5);

              return (
                <Card
                  key={product.id}
                  className={`border-border/80 bg-card overflow-hidden transition-all ${
                    product.is_archived ? 'opacity-60 bg-muted/20' : ''
                  }`}
                >
                  <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading font-bold text-base text-foreground">
                          {product.title}
                        </h3>
                        {product.is_archived ? (
                          <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border">
                            Archived
                          </Badge>
                        ) : hasLowStock ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle size={10} /> Low Stock Alert
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Active Catalog
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">
                          /{product.slug}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                        <span className="font-semibold text-primary">
                          Base: {formatPrice(product.base_price)}
                        </span>
                        <span className="text-muted-foreground">
                          Category: <span className="text-foreground capitalize">{product.category.replace('-', ' ')}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Total Inventory:{' '}
                          <span className={`font-bold ${totalStock <= 5 ? 'text-rose-600' : 'text-foreground'}`}>
                            {totalStock} units
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(product)}
                        className="text-xs h-8 gap-1.5"
                      >
                        <Edit2 size={13} />
                        Edit Product
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleArchive(product.id, product.is_archived)}
                        className={`text-xs h-8 gap-1.5 ${
                          product.is_archived
                            ? 'text-emerald-600 hover:text-emerald-700'
                            : 'text-muted-foreground hover:text-destructive'
                        }`}
                      >
                        {product.is_archived ? (
                          <>
                            <ArchiveRestore size={13} />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive size={13} />
                            Soft Archive
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Variants Sub-table */}
                  <div className="border-t border-border/60 bg-muted/20 px-4 sm:px-6 py-3">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers size={12} />
                      SKU Variants ({product.variants.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {product.variants.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: v.color_hex }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{v.color_name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">{v.sku}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <button
                              onClick={() => handleAdjustStock(product.id, v.id, -1)}
                              className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              -
                            </button>
                            <span
                              className={`w-6 text-center font-bold text-xs ${
                                v.stock_quantity <= 5 ? 'text-rose-600' : 'text-foreground'
                              }`}
                            >
                              {v.stock_quantity}
                            </span>
                            <button
                              onClick={() => handleAdjustStock(product.id, v.id, 1)}
                              className="w-5 h-5 rounded border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Product Edit/Create Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
