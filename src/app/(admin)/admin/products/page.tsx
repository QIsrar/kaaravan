'use client';

import { useState, useEffect } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit2,
  Archive,
  ArchiveRestore,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { ProductFormModal, type ProductFormValues } from '@/components/admin/product-form';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProductVariant {
  id: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: number;
  additional_price: number;
}

interface AdminProductItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  category_name?: string;
  description: string;
  base_price: number;
  image?: string;
  is_archived: boolean;
  variants: ProductVariant[];
}

export default function AdminProductsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [products, setProducts] = useState<AdminProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [sortByLowStock, setSortByLowStock] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormValues | null>(null);

  // Fetch real-time products from shared API
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?admin=true');
      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      }
    } catch (err) {
      console.warn('Failed to load products from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Calculate lowest stock across variants for each product
  const getMinStock = (p: AdminProductItem) => {
    if (!p.variants || p.variants.length === 0) return 0;
    return Math.min(...p.variants.map((v) => v.stock_quantity));
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
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
    })
    .sort((a, b) => {
      if (sortByLowStock) {
        // Priority: lowest stock first (0 -> 1 -> 2 ...)
        return getMinStock(a) - getMinStock(b);
      }
      return 0; // Natural order
    });

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    const nextArchived = !currentArchived;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_archived: nextArchived } : p))
    );

    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_archived: nextArchived }),
      });
      toast.success(
        nextArchived ? 'Product archived from active store' : 'Product restored and live on store!'
      );
    } catch {
      toast.error('Failed to sync archive status with server');
    }
  };

  const handleAdjustStock = async (productId: string, variantId: string, delta: number) => {
    let updatedVariantSku = '';
    let newQty = 0;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          variants: p.variants.map((v) => {
            if (v.id === variantId) {
              updatedVariantSku = v.sku;
              newQty = Math.max(0, v.stock_quantity + delta);
              return { ...v, stock_quantity: newQty };
            }
            return v;
          }),
        };
      })
    );

    try {
      const targetProd = products.find((p) => p.id === productId);
      if (targetProd) {
        const updatedVariants = targetProd.variants.map((v) =>
          v.id === variantId ? { ...v, stock_quantity: Math.max(0, v.stock_quantity + delta) } : v
        );
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: productId, variants: updatedVariants }),
        });
        toast.success(`Stock updated: ${newQty} units live`);
      }
    } catch {
      toast.error('Could not sync stock with server');
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      toast.success(`"${title}" deleted from catalog and database`);
    } catch {
      toast.error('Failed to delete product from database');
    }
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

  const handleSaveProduct = async (formValues: ProductFormValues) => {
    const isEdit = Boolean(formValues.id);

    try {
      const res = await fetch('/api/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formValues,
          is_archived: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          if (isEdit) {
            setProducts((prev) =>
              prev.map((p) => (p.id === formValues.id ? { ...p, ...data.product } : p))
            );
            toast.success('Product updated and live on storefront!');
          } else {
            setProducts((prev) => [data.product, ...prev]);
            toast.success('New product created and live on storefront!');
          }
          return;
        }
      }
      toast.success(isEdit ? 'Product updated!' : 'Product added!');
      fetchProducts();
    } catch {
      toast.error('Failed to save to server');
    }
  };

  const totalSKUs = products.reduce((acc, p) => acc + p.variants.length, 0);
  const outOfStockCount = products.reduce(
    (acc, p) => acc + p.variants.filter((v) => v.stock_quantity === 0).length,
    0
  );
  const lowStockCount = products.reduce(
    (acc, p) => acc + p.variants.filter((v) => v.stock_quantity > 0 && v.stock_quantity <= 5).length,
    0
  );

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Catalog & Inventory"
        subtitle="Live catalog management with real-time storefront synchronization"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI Strip & Action Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-card border-2 border-border shadow-xs">
            <span className="text-xs text-muted-foreground font-medium">Total Products</span>
            <p className="font-heading text-2xl font-bold mt-1 text-foreground">{products.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border-2 border-border shadow-xs">
            <span className="text-xs text-muted-foreground font-medium">Active SKUs</span>
            <p className="font-heading text-2xl font-bold mt-1 text-foreground">{totalSKUs}</p>
          </div>
          <div className={`p-4 rounded-2xl border-2 shadow-xs ${outOfStockCount > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-card border-border'}`}>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <XCircle size={13} /> Out of Stock
            </span>
            <p className="font-heading text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">{outOfStockCount} SKUs</p>
          </div>
          <div className={`p-4 rounded-2xl border-2 shadow-xs ${lowStockCount > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border'}`}>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle size={13} /> Critical Low Stock
            </span>
            <p className="font-heading text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{lowStockCount} SKUs</p>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-4 rounded-2xl bg-card border-2 border-border shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, slug, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 border-2 border-border"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border-2 border-border bg-background text-xs font-medium"
            >
              <option value="all">All Categories</option>
              <option value="hijabs-scarves">Hijabs & Scarves</option>
              <option value="abayas-dresses">Abayas & Dresses</option>
              <option value="modest-sportswear">Modest Sportswear</option>
              <option value="accessories">Accessories</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 px-3 rounded-lg border-2 border-border bg-background text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority Sort Button */}
            <Button
              variant={sortByLowStock ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortByLowStock(!sortByLowStock)}
              className={`h-10 text-xs border-2 cursor-pointer ${
                sortByLowStock
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'border-border text-foreground hover:bg-muted'
              }`}
              title="Prioritize low stock first"
            >
              <ArrowUpDown size={14} className="mr-1.5" />
              {sortByLowStock ? 'Low Stock First (Active)' : 'Sort: Low Stock First'}
            </Button>

            <Button
              onClick={handleOpenCreate}
              className="h-10 text-xs gradient-gold text-espresso font-semibold shadow-xs cursor-pointer"
            >
              <Plus size={15} className="mr-1.5" /> Add Product
            </Button>
          </div>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-border">
            <p className="text-sm text-muted-foreground animate-pulse">Loading live catalog and inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border p-6">
            <Package size={32} className="mx-auto text-muted-foreground mb-3" />
            <h3 className="font-heading font-bold text-lg mb-1">No products match your filters</h3>
            <p className="text-xs text-muted-foreground mb-4">Try clearing filters or add a new piece to your catalog.</p>
            <Button onClick={handleOpenCreate} size="sm" className="gradient-gold text-espresso font-semibold">
              <Plus size={14} className="mr-1" /> Create First Product
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const minStock = getMinStock(product);
              return (
                <Card
                  key={product.id}
                  className={`border-2 transition-all shadow-xs rounded-2xl overflow-hidden ${
                    product.is_archived
                      ? 'border-border/60 bg-muted/20 opacity-75'
                      : minStock === 0
                      ? 'border-rose-500/40 bg-card hover:border-rose-500'
                      : minStock <= 5
                      ? 'border-amber-500/40 bg-card hover:border-amber-500'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Product Meta */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-muted-foreground">
                            {product.id}
                          </span>
                          <h3 className="font-heading font-bold text-base sm:text-lg text-foreground truncate">
                            {product.title}
                          </h3>
                          <Badge variant="secondary" className="text-[11px] capitalize border">
                            {product.category_name || product.category}
                          </Badge>
                          {product.is_archived ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted border-border">
                              Archived
                            </Badge>
                          ) : minStock === 0 ? (
                            <Badge className="text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                              OUT OF STOCK
                            </Badge>
                          ) : minStock <= 5 ? (
                            <Badge className="text-[10px] bg-amber-500 text-espresso font-bold">
                              CRITICAL STOCK ({minStock} left)
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border-emerald-500/30">
                              Active & In Stock
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed">
                          {product.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs font-medium pt-1">
                          <span className="text-primary font-bold font-heading text-sm">
                            {formatPrice(product.base_price)}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            slug: /{product.slug}
                          </span>
                          <Link
                            href={`/shop/${product.slug}`}
                            target="_blank"
                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <ExternalLink size={11} /> View on store
                          </Link>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(product)}
                          className="h-8 text-xs border-2 border-border cursor-pointer hover:bg-muted"
                        >
                          <Edit2 size={13} className="mr-1.5" /> Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleArchive(product.id, product.is_archived)}
                          className="h-8 text-xs border-2 border-border cursor-pointer hover:bg-muted"
                        >
                          {product.is_archived ? (
                            <>
                              <ArchiveRestore size={13} className="mr-1.5" /> Restore
                            </>
                          ) : (
                            <>
                              <Archive size={13} className="mr-1.5" /> Archive
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    {/* Variants Inventory Matrix */}
                    <div className="mt-4 pt-4 border-t-2 border-border/60">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Layers size={12} /> Color Variants & Stock Levels ({product.variants.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {product.variants.map((v) => (
                          <div
                            key={v.id}
                            className={`p-2.5 rounded-xl border-2 flex items-center justify-between gap-2 text-xs ${
                              v.stock_quantity === 0
                                ? 'bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-200'
                                : v.stock_quantity <= 5
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200'
                                : 'bg-muted/40 border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: v.color_hex }}
                              />
                              <div className="truncate">
                                <p className="font-semibold text-[11px] truncate leading-tight">
                                  {v.color_name}
                                </p>
                                <p className="text-[9px] font-mono text-muted-foreground truncate">
                                  {v.sku}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(product.id, v.id, -1)}
                                className="w-5 h-5 rounded bg-card hover:bg-muted border border-border flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                                title="Decrease stock"
                              >
                                -
                              </button>
                              <span
                                className={`font-mono font-bold text-xs px-1 ${
                                  v.stock_quantity === 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : v.stock_quantity <= 5
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-foreground'
                                }`}
                              >
                                {v.stock_quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(product.id, v.id, 1)}
                                className="w-5 h-5 rounded bg-card hover:bg-muted border border-border flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                                title="Increase stock"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}
