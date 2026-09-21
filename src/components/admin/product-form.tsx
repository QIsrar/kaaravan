'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ProductVariantForm {
  id?: string;
  color_name: string;
  color_hex: string;
  sku: string;
  stock_quantity: number;
  additional_price: number; // in cents
}

export interface ProductFormValues {
  id?: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  base_price: number; // in cents
  variants: ProductVariantForm[];
}

export function ProductFormModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ProductFormValues | null;
  onSave: (data: ProductFormValues) => void;
}) {
  const [formData, setFormData] = useState<ProductFormValues>({
    title: '',
    slug: '',
    description: '',
    category: 'hijabs-scarves',
    base_price: 3500,
    variants: [
      {
        color_name: 'Ivory',
        color_hex: '#FFFFF0',
        sku: 'VC-HJB-IVO-01',
        stock_quantity: 25,
        additional_price: 0,
      },
    ],
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        category: 'hijabs-scarves',
        base_price: 3500,
        variants: [
          {
            color_name: 'Ivory',
            color_hex: '#FFFFF0',
            sku: 'VC-HJB-IVO-01',
            stock_quantity: 25,
            additional_price: 0,
          },
        ],
      });
    }
  }, [initialData, isOpen]);

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: initialData ? prev.slug : slug,
    }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          color_name: 'New Color',
          color_hex: '#2B2B2B',
          sku: `VC-${prev.slug.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          stock_quantity: 15,
          additional_price: 0,
        },
      ],
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariantForm, val: any) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, variants: updated };
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      toast.error('Product must have at least one variant');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    onSave(formData);
    toast.success(initialData ? 'Product updated successfully' : 'Product created successfully');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">
            {initialData ? 'Edit Catalog Product' : 'Add New Product'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure product details, categorization, base pricing, and inventory SKUs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="prod-title">Product Title</Label>
              <Input
                id="prod-title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Royal Silk Chiffon Hijab"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-slug">URL Slug</Label>
              <Input
                id="prod-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="royal-silk-chiffon-hijab"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-cat">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger id="prod-cat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hijabs-scarves">Hijabs & Scarves</SelectItem>
                  <SelectItem value="abayas-dresses">Abayas & Dresses</SelectItem>
                  <SelectItem value="modest-sportswear">Modest Sportswear</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Base Price ($ USD)</Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                value={(formData.base_price / 100).toFixed(2)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    base_price: Math.round(parseFloat(e.target.value || '0') * 100),
                  })
                }
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Exquisitely crafted with premium drape and breathable woven textures..."
              />
            </div>
          </div>

          {/* Variants Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading text-sm font-bold text-foreground">
                  Color Variants & Stock SKUs ({formData.variants.length})
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Each color swatch creates an inventory unit with stock allocation
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="text-xs h-8 gap-1"
              >
                <Plus size={13} />
                Add Variant
              </Button>
            </div>

            <div className="space-y-3">
              {formData.variants.map((variant, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border bg-muted/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs"
                >
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px]">Color Name</Label>
                    <Input
                      value={variant.color_name}
                      onChange={(e) => updateVariant(idx, 'color_name', e.target.value)}
                      placeholder="e.g. Sage Green"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px]">Hex Swatch</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={variant.color_hex}
                        onChange={(e) => updateVariant(idx, 'color_hex', e.target.value)}
                        className="w-8 h-8 rounded border border-border cursor-pointer p-0.5"
                      />
                      <Input
                        value={variant.color_hex}
                        onChange={(e) => updateVariant(idx, 'color_hex', e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px]">SKU Code</Label>
                    <Input
                      value={variant.sku}
                      onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                      placeholder="VC-SKU-001"
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px]">Stock Qty</Label>
                    <Input
                      type="number"
                      value={variant.stock_quantity}
                      onChange={(e) =>
                        updateVariant(idx, 'stock_quantity', parseInt(e.target.value || '0', 10))
                      }
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button type="submit" className="gradient-gold text-espresso font-semibold" size="sm">
              <Save size={14} className="mr-1.5" />
              Save Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
