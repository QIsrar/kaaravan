"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Package2,
  Upload,
  Trash2,
  GripVertical,
  Plus,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { compressImageToWebP } from "@/lib/format/image-compression";
import { getPublicImageUrl } from "@/lib/format/image-url";
import { formatPaisaToRupees } from "@/lib/format/currency";
import {
  upsertProductAction,
  uploadProductImageAction,
  deleteProductImageAction,
  reorderProductImagesAction,
} from "@/lib/actions/seller-products";

export interface CategoryOption {
  id: string;
  name: string;
}

export interface BrandOption {
  id: string;
  name: string;
}

export interface ProductVariantItem {
  id?: string;
  sku: string;
  price_rupees: string;
  compare_at_rupees: string;
  stock_quantity: number;
  reserved_quantity?: number;
  low_stock_threshold: number;
  attributes: Record<string, string>;
  is_active: boolean;
}

export interface ProductImageItem {
  id: string;
  path: string;
  sort_order: number;
}

export interface ProductInitialData {
  id: string;
  title: string;
  description: string | null;
  category_id: string;
  brand_id: string | null;
  status: string;
  product_variants: {
    id: string;
    sku: string;
    price_minor: number | bigint;
    compare_at_minor: number | bigint | null;
    stock_quantity: number;
    reserved_quantity: number;
    low_stock_threshold: number;
    attributes: unknown;
    is_active: boolean;
  }[];
  product_images: {
    id: string;
    path: string;
    sort_order: number;
  }[];
}

interface ProductFormProps {
  product?: ProductInitialData;
  categories: CategoryOption[];
  brands: BrandOption[];
  sellerId: string;
}

interface AttributeBuilderRow {
  name: string;
  valuesStr: string;
}

export function ProductForm({
  product,
  categories,
  brands,
}: ProductFormProps) {
  const t = useTranslations("seller.catalog");
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Form Fields
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [brandId, setBrandId] = useState(product?.brand_id || "none");
  const [currentStatus, setCurrentStatus] = useState(product?.status || "draft");

  // Initial Variant Parsing
  const initialVariants: ProductVariantItem[] =
    product?.product_variants && product.product_variants.length > 0
      ? product.product_variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price_rupees: formatPaisaToRupees(Number(v.price_minor)),
          compare_at_rupees: v.compare_at_minor
            ? formatPaisaToRupees(Number(v.compare_at_minor))
            : "",
          stock_quantity: v.stock_quantity,
          reserved_quantity: v.reserved_quantity,
          low_stock_threshold: v.low_stock_threshold,
          attributes: (v.attributes as Record<string, string>) || {},
          is_active: v.is_active,
        }))
      : [
          {
            sku: "",
            price_rupees: "",
            compare_at_rupees: "",
            stock_quantity: 0,
            low_stock_threshold: 5,
            attributes: {},
            is_active: true,
          },
        ];

  const [variants, setVariants] = useState<ProductVariantItem[]>(initialVariants);

  // Variant Builder Attribute State
  const [attributeRows, setAttributeRows] = useState<AttributeBuilderRow[]>([
    { name: "Color", valuesStr: "" },
  ]);

  // Images State (Edit Mode)
  const initialImages: ProductImageItem[] =
    product?.product_images && product.product_images.length > 0
      ? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)
      : [];
  const [images, setImages] = useState<ProductImageItem[]>(initialImages);
  const [imageToDelete, setImageToDelete] = useState<ProductImageItem | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Archive Confirm Dialog
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Saving State & Errors
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Helper: Cart product combinations
  const handleGenerateVariants = () => {
    const validAttrs = attributeRows
      .map((r) => ({
        name: r.name.trim(),
        values: r.valuesStr
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((a) => a.name.length > 0 && a.values.length > 0);

    if (validAttrs.length === 0) {
      toast.error("Please add at least one attribute with values (e.g. Color: Red, Blue)");
      return;
    }

    // Cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const attrValues = validAttrs.map((a) => a.values);
    const combinations = cartesian(attrValues);

    const baseSku =
      title
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 10) || "VAR";

    const newVariants: ProductVariantItem[] = combinations.map((combo, idx) => {
      const attributes: Record<string, string> = {};
      const comboParts: string[] = [];

      combo.forEach((val, i) => {
        const attrName = validAttrs[i].name;
        attributes[attrName] = val;
        comboParts.push(val.slice(0, 3).toUpperCase());
      });

      // Check if variant already exists with these exact attributes to preserve prices
      const existing = variants.find((v) =>
        Object.keys(attributes).every((k) => v.attributes[k] === attributes[k])
      );

      return {
        id: existing?.id,
        sku: existing?.sku || `${baseSku}-${comboParts.join("-")}-${idx + 1}`,
        price_rupees: existing?.price_rupees || "",
        compare_at_rupees: existing?.compare_at_rupees || "",
        stock_quantity: existing?.stock_quantity ?? 0,
        reserved_quantity: existing?.reserved_quantity,
        low_stock_threshold: existing?.low_stock_threshold ?? 5,
        attributes,
        is_active: existing?.is_active ?? true,
      };
    });

    setVariants(newVariants);
    toast.success(`Generated ${newVariants.length} variants`);
  };

  const handleAddSingleVariant = () => {
    const baseSku =
      title
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .slice(0, 12) || "SKU";

    setVariants([
      {
        sku: variants[0]?.sku || `${baseSku}-01`,
        price_rupees: variants[0]?.price_rupees || "",
        compare_at_rupees: variants[0]?.compare_at_rupees || "",
        stock_quantity: variants[0]?.stock_quantity ?? 0,
        reserved_quantity: variants[0]?.reserved_quantity,
        low_stock_threshold: variants[0]?.low_stock_threshold ?? 5,
        attributes: {},
        is_active: true,
      },
    ]);
  };

  const handleAddVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        price_rupees: "",
        compare_at_rupees: "",
        stock_quantity: 0,
        low_stock_threshold: 5,
        attributes: {},
        is_active: true,
      },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length <= 1) {
      toast.error("A product must have at least one variant");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantField = <K extends keyof ProductVariantItem>(
    index: number,
    field: K,
    value: ProductVariantItem[K]
  ) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });

    // Clear field-specific error
    const key = `variants.${index}.${String(field)}`;
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Status Badge Rendering
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold px-3 py-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 me-1.5" />
            {t("statusActive")}
          </Badge>
        );
      case "pending_review":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold px-3 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 me-1.5" />
            {t("statusPendingReview")}
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="text-muted-foreground font-semibold px-3 py-1 text-xs">
            {t("statusArchived")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-semibold px-3 py-1 text-xs">
            <AlertCircle className="w-3.5 h-3.5 me-1.5" />
            {t("statusRejected")}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-semibold px-3 py-1 text-xs">
            {t("statusDraft")}
          </Badge>
        );
    }
  };

  // Submit Handler
  const handleSubmit = async (targetStatus: "draft" | "pending_review" | "archived") => {
    setGlobalError(null);
    setFieldErrors({});

    // Basic frontend checks
    if (!title.trim()) {
      setFieldErrors((prev) => ({ ...prev, title: "Title is required (at least 5 characters)" }));
      toast.error("Please enter a product title");
      return;
    }
    if (!categoryId) {
      setFieldErrors((prev) => ({ ...prev, category_id: "Category is required" }));
      toast.error("Please select a leaf category");
      return;
    }
    if (variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId,
        brand_id: brandId === "none" ? null : brandId,
        status: targetStatus,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku.trim(),
          price_rupees: v.price_rupees.trim(),
          compare_at_rupees: v.compare_at_rupees.trim() || null,
          stock_quantity: Number(v.stock_quantity),
          low_stock_threshold: Number(v.low_stock_threshold),
          attributes: v.attributes,
          is_active: v.is_active,
        })),
      };

      const result = await upsertProductAction(payload, product?.id);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        setGlobalError(result.error || "Failed to save product");
        toast.error(result.error || "Failed to save product");
        setIsSaving(false);
        return;
      }

      toast.success(targetStatus === "archived" ? t("productArchived") : t("productSaved"));
      setCurrentStatus(targetStatus);

      // If created new product, navigate to edit page so seller can upload images
      const createdProductId = result.data?.productId;
      if (!product?.id && createdProductId) {
        startTransition(() => {
          router.push(`/seller/products/${createdProductId}`);
        });
      } else {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setGlobalError(e.message || "An unexpected error occurred");
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Image Upload Handlers
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !product?.id) return;

    if (images.length + files.length > 8) {
      toast.error("Maximum 8 images allowed per product");
      return;
    }

    setIsUploadingImages(true);
    const fileList = Array.from(files);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgressText(`Compressing & uploading ${i + 1}/${fileList.length}...`);

        // Compress to WebP (max 1600px)
        const compressedWebP = await compressImageToWebP(file, 1600);

        const formData = new FormData();
        formData.append("file", compressedWebP);

        const res = await uploadProductImageAction(product.id, formData);
        if (!res.success || !res.data) {
          throw new Error(res.error || "Upload failed");
        }

        const newImage: ProductImageItem = {
          id: res.data.id,
          path: res.data.path,
          sort_order: res.data.sort_order,
        };

        setImages((prev) => [...prev, newImage]);
      }

      toast.success(t("imageUploaded"));
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to upload image");
    } finally {
      setIsUploadingImages(false);
      setUploadProgressText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Image Delete
  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete || !product?.id) return;

    setIsDeletingImage(true);
    try {
      const res = await deleteProductImageAction(imageToDelete.id, product.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete image");
      }

      setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
      toast.success(t("imageDeleted"));
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to delete image");
    } finally {
      setIsDeletingImage(false);
      setImageToDelete(null);
    }
  };

  // Image Reordering
  const handleMoveImage = async (index: number, direction: "prev" | "next") => {
    if (!product?.id) return;
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    setImages(newImages);

    try {
      const orderedIds = newImages.map((img) => img.id);
      const res = await reorderProductImagesAction(product.id, orderedIds);
      if (!res.success) throw new Error(res.error || "Reorder failed");
      toast.success(t("imageOrderUpdated"));
    } catch {
      toast.error("Failed to save image order");
      setImages(images); // Revert
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedImageIndex === null || draggedImageIndex === targetIndex || !product?.id) {
      setDraggedImageIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedImageIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    setImages(newImages);
    setDraggedImageIndex(null);

    try {
      const orderedIds = newImages.map((img) => img.id);
      const res = await reorderProductImagesAction(product.id, orderedIds);
      if (!res.success) throw new Error(res.error || "Reorder failed");
      toast.success(t("imageOrderUpdated"));
    } catch {
      toast.error("Failed to save image order");
      setImages(images); // Revert
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              {product?.id ? t("editProduct") : t("newProduct")}
            </h1>
            {product?.id && renderStatusBadge(currentStatus)}
          </div>
          <p className="text-sm text-muted-foreground">
            {t("productsSubtitle")}
          </p>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => handleSubmit("draft")}
            className="rounded-xl"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {t("saveDraft")}
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit("pending_review")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {t("submitReview")}
          </Button>

          {product?.id && currentStatus !== "archived" && (
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => setShowArchiveDialog(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
            >
              {t("archive")}
            </Button>
          )}
        </div>
      </div>

      {/* Global Error Notice */}
      {globalError && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to save product</p>
            <p className="text-xs text-destructive/90">{globalError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Details & Variants */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card 1: Basic Information */}
          <Card className="rounded-3xl border-border/80 shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-lg">Product Details</CardTitle>
              <CardDescription>
                Title, leaf category classification, and artisan description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold">
                  {t("productTitle")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  dir="auto"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.title;
                        return next;
                      });
                    }
                  }}
                  placeholder={t("productTitlePlaceholder")}
                  className={`bg-background rounded-xl ${
                    fieldErrors.title ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold">
                  {t("description")}
                </Label>
                <Textarea
                  id="description"
                  dir="auto"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  className="bg-background rounded-xl resize-y"
                />
              </div>

              {/* Category & Brand (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Category (Active Leaf Categories Only) */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-semibold">
                    {t("category")} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={categoryId}
                    onValueChange={(val: string | null) => {
                      if (val) {
                        setCategoryId(val);
                        if (fieldErrors.category_id) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.category_id;
                            return next;
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger
                      id="category"
                      className={`bg-background rounded-xl ${
                        fieldErrors.category_id
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.category_id && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.category_id}
                    </p>
                  )}
                </div>

                {/* Brand (Optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="brand" className="text-xs font-semibold">
                    {t("brand")}
                  </Label>
                  <Select
                    value={brandId}
                    onValueChange={(val: string | null) => {
                      if (val) setBrandId(val);
                    }}
                  >
                    <SelectTrigger id="brand" className="bg-background rounded-xl">
                      <SelectValue placeholder={t("selectBrand")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("noBrand")}</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Variant Builder */}
          <Card className="rounded-3xl border-border/80 shadow-2xs">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="font-heading text-lg">{t("variantBuilder")}</CardTitle>
                  <CardDescription>{t("variantBuilderDesc")}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSingleVariant}
                    className="rounded-xl text-xs"
                  >
                    {t("addSingleVariant")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Attribute Configuration Rows */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Attributes (e.g. Color, Size, Material)
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setAttributeRows((prev) => [...prev, { name: "", valuesStr: "" }])
                    }
                    className="text-primary hover:text-primary/90 text-xs h-8 px-2"
                  >
                    <Plus className="w-3.5 h-3.5 me-1" />
                    {t("addAttribute")}
                  </Button>
                </div>

                {attributeRows.map((attr, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder={t("attributeNamePlaceholder")}
                      value={attr.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAttributeRows((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], name: val };
                          return next;
                        });
                      }}
                      className="w-1/3 bg-background rounded-xl text-xs h-9"
                    />
                    <Input
                      placeholder={t("attributeValuesPlaceholder")}
                      value={attr.valuesStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAttributeRows((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], valuesStr: val };
                          return next;
                        });
                      }}
                      className="flex-1 bg-background rounded-xl text-xs h-9"
                    />
                    {attributeRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setAttributeRows((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-muted-foreground hover:text-destructive h-9 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateVariants}
                    className="bg-primary/90 hover:bg-primary text-primary-foreground rounded-xl text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 me-1.5" />
                    {t("generateVariants")}
                  </Button>
                </div>
              </div>

              {/* Variants Rows Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    {t("variantsTitle")} ({variants.length})
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariantRow}
                    className="rounded-xl text-xs h-8"
                  >
                    <Plus className="w-3.5 h-3.5 me-1" />
                    Add Row
                  </Button>
                </div>

                <div className="space-y-3">
                  {variants.map((v, idx) => {
                    const skuError =
                      fieldErrors[`variants.${idx}.sku`] ||
                      (fieldErrors.sku && variants.filter((x) => x.sku === v.sku).length > 1
                        ? fieldErrors.sku
                        : null);

                    const compareError =
                      fieldErrors[`variants.${idx}.compare_at_rupees`] ||
                      (fieldErrors.compare_at &&
                      v.compare_at_rupees &&
                      Number(v.compare_at_rupees) <= Number(v.price_rupees)
                        ? fieldErrors.compare_at
                        : null);

                    const stockError =
                      fieldErrors[`variants.${idx}.stock_quantity`] ||
                      (fieldErrors.stock &&
                      v.reserved_quantity !== undefined &&
                      v.stock_quantity < v.reserved_quantity
                        ? fieldErrors.stock
                        : null);

                    const attrLabel =
                      Object.entries(v.attributes)
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(" · ") || "Single / Default";

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border transition-colors ${
                          v.is_active
                            ? "bg-card border-border shadow-2xs"
                            : "bg-muted/30 border-dashed border-border/80 opacity-70"
                        }`}
                      >
                        {/* Variant Header / Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">
                              {attrLabel}
                            </Badge>
                            {v.reserved_quantity !== undefined && v.reserved_quantity > 0 && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                ({v.reserved_quantity} reserved)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={v.is_active}
                                onChange={(e) =>
                                  updateVariantField(idx, "is_active", e.target.checked)
                                }
                                className="rounded text-primary focus:ring-primary h-4 w-4"
                              />
                              <span>{t("active")}</span>
                            </label>

                            {variants.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveVariantRow(idx)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Variant Row Inputs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {/* SKU */}
                          <div className="col-span-2 sm:col-span-1 space-y-1">
                            <Label className="text-[11px] font-semibold text-muted-foreground">
                              {t("sku")} *
                            </Label>
                            <Input
                              value={v.sku}
                              onChange={(e) => updateVariantField(idx, "sku", e.target.value)}
                              placeholder="e.g. MK-01-BLU"
                              className={`h-9 font-mono text-xs rounded-xl ${
                                skuError ? "border-destructive focus-visible:ring-destructive" : ""
                              }`}
                            />
                            {skuError && (
                              <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {skuError}
                              </p>
                            )}
                          </div>

                          {/* Price */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-muted-foreground">
                              {t("priceRupees")} *
                            </Label>
                            <Input
                              value={v.price_rupees}
                              onChange={(e) =>
                                updateVariantField(idx, "price_rupees", e.target.value)
                              }
                              placeholder="2500"
                              className="h-9 font-mono text-xs rounded-xl"
                            />
                          </div>

                          {/* Compare At Price */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-muted-foreground">
                              {t("compareAtRupees")}
                            </Label>
                            <Input
                              value={v.compare_at_rupees}
                              onChange={(e) =>
                                updateVariantField(idx, "compare_at_rupees", e.target.value)
                              }
                              placeholder="3000"
                              className={`h-9 font-mono text-xs rounded-xl ${
                                compareError ? "border-destructive focus-visible:ring-destructive" : ""
                              }`}
                            />
                            {compareError && (
                              <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {compareError}
                              </p>
                            )}
                          </div>

                          {/* Stock Quantity */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-muted-foreground">
                              {t("stock")} *
                            </Label>
                            <Input
                              type="number"
                              min={v.reserved_quantity ?? 0}
                              value={v.stock_quantity}
                              onChange={(e) =>
                                updateVariantField(
                                  idx,
                                  "stock_quantity",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className={`h-9 font-mono text-xs rounded-xl ${
                                stockError ? "border-destructive focus-visible:ring-destructive" : ""
                              }`}
                            />
                            {stockError && (
                              <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {stockError}
                              </p>
                            )}
                          </div>

                          {/* Low Stock Alert */}
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold text-muted-foreground">
                              {t("lowStockThreshold")}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={v.low_stock_threshold}
                              onChange={(e) =>
                                updateVariantField(
                                  idx,
                                  "low_stock_threshold",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="h-9 font-mono text-xs rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Product Images & Guidelines */}
        <div className="space-y-8">
          {/* Card 3: Images */}
          <Card className="rounded-3xl border-border/80 shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-lg">{t("productImages")}</CardTitle>
              <CardDescription>{t("imagesMaxNotice")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product?.id ? (
                <>
                  {/* Upload Drop Zone / Button */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isUploadingImages || images.length >= 8}
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="product-images-input"
                    />

                    <label
                      htmlFor="product-images-input"
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border/80 transition-colors text-center cursor-pointer ${
                        images.length >= 8
                          ? "opacity-50 cursor-not-allowed bg-muted/20"
                          : "hover:border-primary/50 hover:bg-primary/5 bg-card"
                      }`}
                    >
                      {isUploadingImages ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <span className="text-xs font-medium text-foreground">
                            {uploadProgressText || t("uploading")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-primary block">
                              {images.length >= 8 ? "Max 8 Images Uploaded" : t("uploadImage")}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {images.length}/8 uploaded · Compressed to WebP (max 1600px)
                            </span>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Images List with Drag-to-Reorder */}
                  {images.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        {t("dragToReorder")}
                      </p>

                      <div className="space-y-2">
                        {images.map((img, idx) => (
                          <div
                            key={img.id}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(idx)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border bg-card transition-all cursor-grab active:cursor-grabbing ${
                              draggedImageIndex === idx
                                ? "border-primary scale-[1.02] shadow-md"
                                : "border-border/80 hover:border-primary/40 shadow-xs"
                            }`}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />

                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                              <Image
                                src={getPublicImageUrl(img.path)}
                                alt={`Product photo ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              {idx === 0 ? (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0">
                                  {t("mainImage")}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground font-mono">
                                  Photo #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Move Up/Down Controls for touch / accessible */}
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={idx === 0}
                                onClick={() => handleMoveImage(idx, "prev")}
                                className="h-7 w-7 p-0 text-muted-foreground"
                                title="Move up"
                              >
                                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={idx === images.length - 1}
                                onClick={() => handleMoveImage(idx, "next")}
                                className="h-7 w-7 p-0 text-muted-foreground"
                                title="Move down"
                              >
                                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setImageToDelete(img)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title={t("delete")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 rounded-2xl bg-muted/20 border border-dashed border-border/80">
                      <Package2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-muted-foreground">No photos uploaded yet</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-5 rounded-2xl bg-muted/40 border border-dashed border-border/80 text-center space-y-2">
                  <Info className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("saveProductFirstNotice")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Marketplace Rules Guidance */}
          <Card className="rounded-3xl border-border/80 bg-primary/5 shadow-none">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                Kaaravan Catalog Integrity
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc list-inside">
                <li>Money amounts are processed and stored securely in minor units.</li>
                <li>Compare-at price must always be strictly higher than your selling price.</li>
                <li>Stock quantities cannot be lowered below orders currently reserved by buyers.</li>
                <li>All photos are compressed to high-performance WebP before upload.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog
        open={Boolean(imageToDelete)}
        onOpenChange={(open) => !open && setImageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteImageTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteImageDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingImage}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingImage}
              onClick={handleConfirmDeleteImage}
            >
              {isDeletingImage ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : null}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Product Confirmation Dialog */}
      <AlertDialog
        open={showArchiveDialog}
        onOpenChange={(open) => !open && setShowArchiveDialog(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("archiveConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("archiveConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSaving}
              onClick={() => {
                setShowArchiveDialog(false);
                handleSubmit("archived");
              }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t("archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
