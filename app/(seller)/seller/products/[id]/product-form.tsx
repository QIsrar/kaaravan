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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  ChevronsUpDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
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
import { formatPaisaToRupees, parseRupeesToPaisa } from "@/lib/format/currency";
import {
  upsertProductAction,
  uploadProductImageAction,
  deleteProductImageAction,
  reorderProductImagesAction,
} from "@/lib/actions/seller-products";

export interface CategoryOption {
  id: string;
  name: string;
  parentName?: string;
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
  stock_quantity: string;
  reserved_quantity?: number;
  low_stock_threshold: string;
  attributes: Record<string, string>;
  is_active: boolean;
}

export interface QueuedImage {
  id: string;
  file: File;
  previewUrl: string;
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
  const [openCategory, setOpenCategory] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);

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
          stock_quantity: String(v.stock_quantity ?? 0),
          reserved_quantity: v.reserved_quantity,
          low_stock_threshold: String(v.low_stock_threshold ?? 5),
          attributes: (v.attributes as Record<string, string>) || {},
          is_active: v.is_active,
        }))
      : [
          {
            sku: "",
            price_rupees: "",
            compare_at_rupees: "",
            stock_quantity: "0",
            low_stock_threshold: "5",
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
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isReorderingImages, setIsReorderingImages] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queued Images State (New Product Mode)
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const queuedFileInputRef = useRef<HTMLInputElement>(null);

  const isAnyImageActionPending =
    isUploadingImages || isReorderingImages || deletingImageId !== null;

  const categoriesByParent = React.useMemo(() => {
    const map: Record<string, CategoryOption[]> = {};
    for (const cat of categories) {
      const parent = cat.parentName || "General";
      if (!map[parent]) map[parent] = [];
      map[parent].push(cat);
    }
    return map;
  }, [categories]);

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
        stock_quantity: existing?.stock_quantity ?? "0",
        reserved_quantity: existing?.reserved_quantity,
        low_stock_threshold: existing?.low_stock_threshold ?? "5",
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
        stock_quantity: variants[0]?.stock_quantity || "0",
        reserved_quantity: variants[0]?.reserved_quantity,
        low_stock_threshold: variants[0]?.low_stock_threshold || "5",
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
        stock_quantity: "0",
        low_stock_threshold: "5",
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
    if (fieldErrors[key] || fieldErrors[String(field)]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        delete next[String(field)];
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

  // Error mapping & smooth scrolling
  const getElementIdForErrorKey = (key: string): string => {
    if (key === "title") return "field-title";
    if (key === "category_id" || key === "category") return "field-category";
    if (key === "description") return "field-description";
    if (key.startsWith("variants.")) {
      const parts = key.split(".");
      const vIdx = parts[1];
      const field = parts[2] || "sku";
      return `field-variants-${vIdx}-${field}`;
    }
    if (key === "sku") return "field-variants-0-sku";
    if (key === "compare_at") return "field-variants-0-compare_at_rupees";
    if (key === "stock") return "field-variants-0-stock_quantity";
    if (key === "images") return "field-product-images";
    if (key === "variants") return "field-variants-0-sku";
    return "field-title";
  };

  const scrollToAndFocus = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        el.focus();
      }, 150);
    }
  };

  const getErrorSummaryList = () => {
    const list: { key: string; elementId: string; label: string; message: string }[] = [];

    for (const [key, msg] of Object.entries(fieldErrors)) {
      if (!msg) continue;
      const elementId = getElementIdForErrorKey(key);

      if (key === "title") {
        const clean = msg.replace(/^(Product Title|Title):\s*/i, "").trim();
        list.push({ key, elementId, label: t("productTitle"), message: `${t("productTitle")}: ${clean || msg}` });
      } else if (key === "category_id" || key === "category") {
        const clean = msg.replace(/^Category:\s*/i, "").trim();
        list.push({ key, elementId, label: t("category"), message: `${t("category")}: ${clean || msg}` });
      } else if (key === "description") {
        const clean = msg.replace(/^Description:\s*/i, "").trim();
        list.push({ key, elementId, label: t("description"), message: `${t("description")}: ${clean || msg}` });
      } else if (key === "images") {
        list.push({ key, elementId, label: t("productImages"), message: `${t("productImages")}: ${msg}` });
      } else if (key === "variants") {
        list.push({ key, elementId, label: t("variantsTitle"), message: `${t("variantsTitle")}: ${msg}` });
      } else if (key.startsWith("variants.")) {
        const parts = key.split(".");
        const vIdx = parseInt(parts[1], 10);
        const fieldName = parts[2];
        const v = variants[vIdx];
        const attrStr = v ? Object.values(v.attributes).filter(Boolean).join(" / ") : "";
        const variantLabel = `Variant ${vIdx + 1}${attrStr ? ` (${attrStr})` : ""}`;

        let fieldLabel = fieldName;
        if (fieldName === "sku") fieldLabel = t("sku");
        else if (fieldName === "price_rupees" || fieldName === "price") fieldLabel = t("priceRupees");
        else if (fieldName === "compare_at_rupees" || fieldName === "compare_at") fieldLabel = t("compareAtRupees");
        else if (fieldName === "stock_quantity" || fieldName === "stock") fieldLabel = t("stock");
        else if (fieldName === "low_stock_threshold") fieldLabel = t("lowStockThreshold");

        const cleanMsg = msg.replace(/^Variant\s+\d+[^:]*:\s*/i, "").trim();

        list.push({
          key,
          elementId,
          label: `${variantLabel}: ${fieldLabel}`,
          message: `${variantLabel}: ${cleanMsg || msg}`,
        });
      } else if (key === "sku") {
        list.push({ key, elementId, label: t("sku"), message: `${t("sku")}: ${msg}` });
      } else if (key === "compare_at") {
        list.push({ key, elementId, label: t("compareAtRupees"), message: `${t("compareAtRupees")}: ${msg}` });
      } else if (key === "stock") {
        list.push({ key, elementId, label: t("stock"), message: `${t("stock")}: ${msg}` });
      } else {
        list.push({ key, elementId, label: key, message: msg });
      }
    }

    return list;
  };

  // Queued Image Handlers (New Product)
  const handleQueuedImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (queuedImages.length + files.length > 8) {
      toast.error("Maximum 8 images allowed per product");
      return;
    }

    const newItems: QueuedImage[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setQueuedImages((prev) => [...prev, ...newItems]);
    if (queuedFileInputRef.current) queuedFileInputRef.current.value = "";
  };

  const handleRemoveQueuedImage = (index: number) => {
    setQueuedImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMoveQueuedImage = (index: number, direction: "prev" | "next") => {
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queuedImages.length) return;
    setQueuedImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Submit Handler
  const handleSubmit = async (targetStatus: "draft" | "pending_review" | "archived") => {
    setGlobalError(null);
    setFieldErrors({});

    // Validate only on save
    const clientErrors: Record<string, string> = {};

    if (targetStatus === "pending_review") {
      if (!product?.id) {
        toast.error("Please save the product as draft first before submitting for review.");
        return;
      }
      if (images.length === 0) {
        clientErrors.images = t("submitReviewHintImages");
      }
      const hasActive = variants.some((v) => {
        if (!v.is_active) return false;
        try {
          return parseRupeesToPaisa(v.price_rupees) > 0;
        } catch {
          return false;
        }
      });
      if (!hasActive) {
        clientErrors.variants = t("submitReviewHintVariants");
      }
    }

    if (!title.trim()) {
      clientErrors.title = "Title is required (at least 5 characters)";
    } else if (title.trim().length < 5) {
      clientErrors.title = "Title must be at least 5 characters";
    }

    if (!categoryId) {
      clientErrors.category_id = "Please select a category";
    }

    if (variants.length === 0) {
      clientErrors.variants = "At least one variant is required";
    } else {
      variants.forEach((v, idx) => {
        const attrStr = Object.values(v.attributes).filter(Boolean).join(" / ");
        const variantPrefix = `Variant ${idx + 1}${attrStr ? ` (${attrStr})` : ""}`;

        if (!v.sku.trim()) {
          clientErrors[`variants.${idx}.sku`] = `${variantPrefix}: SKU is required (at least 2 characters)`;
        } else if (v.sku.trim().length < 2) {
          clientErrors[`variants.${idx}.sku`] = `${variantPrefix}: SKU must be at least 2 characters`;
        }

        if (!v.price_rupees.trim()) {
          clientErrors[`variants.${idx}.price_rupees`] = `${variantPrefix}: Price is required`;
        } else {
          try {
            const p = parseRupeesToPaisa(v.price_rupees);
            if (p <= 0) {
              clientErrors[`variants.${idx}.price_rupees`] = `${variantPrefix}: Price must be greater than 0`;
            }
          } catch {
            clientErrors[`variants.${idx}.price_rupees`] = `${variantPrefix}: Invalid price format`;
          }
        }

        if (v.compare_at_rupees.trim()) {
          try {
            const cp = parseRupeesToPaisa(v.compare_at_rupees);
            let pp = 0;
            try {
              pp = parseRupeesToPaisa(v.price_rupees);
            } catch {}
            if (pp > 0 && cp <= pp) {
              clientErrors[`variants.${idx}.compare_at_rupees`] = `${variantPrefix}: Original price must be higher than the price`;
            }
          } catch {
            clientErrors[`variants.${idx}.compare_at_rupees`] = `${variantPrefix}: Invalid original price format`;
          }
        }

        const stockNum = parseInt(v.stock_quantity.trim() || "0", 10);
        if (isNaN(stockNum) || stockNum < 0) {
          clientErrors[`variants.${idx}.stock_quantity`] = `${variantPrefix}: Stock must be a non-negative number`;
        } else if (v.reserved_quantity !== undefined && stockNum < v.reserved_quantity) {
          clientErrors[`variants.${idx}.stock_quantity`] = `${variantPrefix}: Stock cannot be less than reserved quantity (${v.reserved_quantity})`;
        }

        const threshNum = parseInt(v.low_stock_threshold.trim() || "0", 10);
        if (isNaN(threshNum) || threshNum < 0) {
          clientErrors[`variants.${idx}.low_stock_threshold`] = `${variantPrefix}: Low stock alert must be a non-negative number`;
        }
      });
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      toast.error("Please fix the errors below before saving");
      const firstKey = Object.keys(clientErrors)[0];
      const targetId = getElementIdForErrorKey(firstKey);
      setTimeout(() => {
        scrollToAndFocus(targetId);
      }, 100);
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
          stock_quantity: parseInt(v.stock_quantity.trim() || "0", 10),
          low_stock_threshold: parseInt(v.low_stock_threshold.trim() || "5", 10),
          attributes: v.attributes,
          is_active: v.is_active,
        })),
      };

      const result = await upsertProductAction(payload, product?.id);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          const firstKey = Object.keys(result.fieldErrors)[0];
          const targetId = getElementIdForErrorKey(firstKey);
          setTimeout(() => {
            scrollToAndFocus(targetId);
          }, 100);
        }
        setGlobalError(result.error || "Failed to save product");
        toast.error(result.error || "Failed to save product");
        setIsSaving(false);
        return;
      }

      const createdProductId = result.data?.productId;

      // If created new product and has queued images, upload them automatically
      if (!product?.id && createdProductId && queuedImages.length > 0) {
        setIsUploadingImages(true);
        let hadUploadError = false;

        for (let i = 0; i < queuedImages.length; i++) {
          const q = queuedImages[i];
          setUploadProgressText(`Compressing & uploading image ${i + 1}/${queuedImages.length} (${q.file.name})...`);
          try {
            const compressed = await compressImageToWebP(q.file, 1600);
            const formData = new FormData();
            formData.append("file", compressed);

            const upRes = await uploadProductImageAction(createdProductId, formData);
            if (!upRes.success) {
              hadUploadError = true;
              toast.error(`Image "${q.file.name}" failed to upload: ${upRes.error || "Upload failed"}`);
            }
          } catch (upErr: unknown) {
            hadUploadError = true;
            const msg = upErr instanceof Error ? upErr.message : "Upload error";
            toast.error(`Image "${q.file.name}" failed to upload: ${msg}`);
          }
        }

        setIsUploadingImages(false);
        setUploadProgressText("");
        queuedImages.forEach((q) => URL.revokeObjectURL(q.previewUrl));
        setQueuedImages([]);

        if (hadUploadError) {
          toast.warning("Product was created, but some images failed to upload.");
        }
      }

      if (targetStatus === "pending_review") {
        toast.success(t("submittedForReview"));
      } else if (targetStatus === "draft") {
        toast.success(t("draftSaved"));
      } else if (targetStatus === "archived") {
        toast.success(t("productArchived"));
      } else {
        toast.success(t("productSaved"));
      }
      setCurrentStatus(targetStatus);

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
    if (!imageToDelete || !product?.id || isAnyImageActionPending) return;
    const target = imageToDelete;
    setImageToDelete(null); // Close immediately
    setDeletingImageId(target.id);

    try {
      const res = await deleteProductImageAction(target.id, product.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete image");
      }

      setImages((prev) => prev.filter((img) => img.id !== target.id));
      toast.success(t("imageDeleted"));
    } catch (err: unknown) {
      const e = err as Error;
      toast.error(e.message || "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  };

  // Image Reordering
  const handleMoveImage = async (index: number, direction: "prev" | "next") => {
    if (!product?.id || isAnyImageActionPending) return;
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const prevImages = [...images];
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    setImages(newImages);
    setIsReorderingImages(true);

    try {
      const orderedIds = newImages.map((img) => img.id);
      const res = await reorderProductImagesAction(product.id, orderedIds);
      if (!res.success) throw new Error(res.error || "Reorder failed");
      toast.success(t("imageOrderUpdated"));
    } catch (err: unknown) {
      setImages(prevImages); // Revert
      const msg = err instanceof Error ? err.message : "Failed to save image order";
      toast.error(msg);
    } finally {
      setIsReorderingImages(false);
    }
  };

  const handleDragStart = (index: number) => {
    if (isAnyImageActionPending) return;
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isAnyImageActionPending) return;
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (isAnyImageActionPending) {
      setDraggedImageIndex(null);
      return;
    }
    if (draggedImageIndex === null || draggedImageIndex === targetIndex || !product?.id) {
      setDraggedImageIndex(null);
      return;
    }

    const fromIndex = draggedImageIndex;
    setDraggedImageIndex(null);

    const prevImages = [...images];
    const newImages = [...images];
    const [draggedItem] = newImages.splice(fromIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    setImages(newImages);
    setIsReorderingImages(true);

    try {
      const orderedIds = newImages.map((img) => img.id);
      const res = await reorderProductImagesAction(product.id, orderedIds);
      if (!res.success) throw new Error(res.error || "Reorder failed");
      toast.success(t("imageOrderUpdated"));
    } catch (err: unknown) {
      setImages(prevImages); // Revert
      const msg = err instanceof Error ? err.message : "Failed to save image order";
      toast.error(msg);
    } finally {
      setIsReorderingImages(false);
    }
  };

  const isProductSaved = Boolean(product?.id);
  const hasUploadedImages = images.length > 0;
  const hasActiveVariantWithPrice = variants.some((v) => {
    if (!v.is_active) return false;
    if (!v.price_rupees.trim()) return false;
    try {
      return parseRupeesToPaisa(v.price_rupees) > 0;
    } catch {
      return false;
    }
  });
  const canSubmitForReview = isProductSaved && hasUploadedImages && hasActiveVariantWithPrice;

  let submitReviewHint: string | null = null;
  if (isProductSaved && !canSubmitForReview) {
    if (!hasUploadedImages && !hasActiveVariantWithPrice) {
      submitReviewHint = t("submitReviewHintBoth");
    } else if (!hasUploadedImages) {
      submitReviewHint = t("submitReviewHintImages");
    } else if (!hasActiveVariantWithPrice) {
      submitReviewHint = t("submitReviewHintVariants");
    }
  }

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
        <div className="flex flex-col sm:items-end gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              id="save-draft-btn"
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSubmit("draft")}
              className="rounded-xl"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t("saveDraft")}
            </Button>

            {isProductSaved && (
              <Button
                id="submit-review-btn"
                type="button"
                disabled={isSaving || !canSubmitForReview}
                onClick={() => handleSubmit("pending_review")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                title={submitReviewHint || undefined}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                {t("submitReview")}
              </Button>
            )}

            {isProductSaved && currentStatus !== "archived" && (
              <Button
                id="archive-btn"
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

          {submitReviewHint && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>{submitReviewHint}</span>
            </p>
          )}
        </div>
      </div>

      {/* Top Error Summary Notice */}
      {(globalError || getErrorSummaryList().length > 0) && (
        <div className="p-4 sm:p-5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold text-sm">Please fix the following problems before saving:</p>
              {globalError && <p className="text-xs text-destructive/90">{globalError}</p>}
            </div>
          </div>
          {getErrorSummaryList().length > 0 && (
            <ul className="text-xs space-y-1.5 ps-8 list-disc">
              {getErrorSummaryList().map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => scrollToAndFocus(item.elementId)}
                    className="text-start underline underline-offset-2 hover:opacity-80 font-medium cursor-pointer"
                  >
                    {item.message}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
                <Label htmlFor="field-title" className="text-xs font-semibold">
                  {t("productTitle")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="field-title"
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
                    fieldErrors.title
                      ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                      : ""
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
                <Label htmlFor="field-description" className="text-xs font-semibold">
                  {t("description")}
                </Label>
                <Textarea
                  id="field-description"
                  dir="auto"
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (fieldErrors.description) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.description;
                        return next;
                      });
                    }
                  }}
                  placeholder={t("descriptionPlaceholder")}
                  className={`bg-background rounded-xl resize-y ${
                    fieldErrors.description
                      ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                      : ""
                  }`}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Category & Brand (Side by Side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Category (Active Leaf Categories Grouped by Parent) */}
                <div className="space-y-1.5">
                  <Label htmlFor="field-category" className="text-xs font-semibold">
                    {t("category")} <span className="text-destructive">*</span>
                  </Label>
                  {(() => {
                    const selectedCategory = categories.find((c) => c.id === categoryId);
                    const categoryError = fieldErrors.category_id || fieldErrors.category;
                    return (
                      <Popover open={openCategory} onOpenChange={setOpenCategory}>
                        <PopoverTrigger
                          render={
                            <Button
                              id="field-category"
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCategory}
                              className={cn(
                                "w-full justify-between rounded-xl bg-background text-xs font-normal h-9 px-3",
                                !categoryId && "text-muted-foreground",
                                categoryError &&
                                  "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                              )}
                            >
                              <span className="truncate">
                                {selectedCategory ? selectedCategory.name : t("selectCategory")}
                              </span>
                              <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50 ms-2" />
                            </Button>
                          }
                        />
                        <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder={t("searchCategory")} />
                            <CommandList>
                              <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
                              {Object.entries(categoriesByParent).map(([parentName, items]) => (
                                <CommandGroup key={parentName} heading={parentName}>
                                  {items.map((c) => (
                                    <CommandItem
                                      key={c.id}
                                      value={c.name}
                                      keywords={[parentName]}
                                      onSelect={() => {
                                        setCategoryId(c.id);
                                        if (fieldErrors.category_id || fieldErrors.category) {
                                          setFieldErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.category_id;
                                            delete next.category;
                                            return next;
                                          });
                                        }
                                        setOpenCategory(false);
                                      }}
                                    >
                                      <span className="flex-1 text-start">{c.name}</span>
                                      {categoryId === c.id && (
                                        <Check className="w-4 h-4 text-primary shrink-0 ms-2" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    );
                  })()}
                  {(fieldErrors.category_id || fieldErrors.category) && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.category_id || fieldErrors.category}
                    </p>
                  )}
                </div>

                {/* Brand (Optional) */}
                <div className="space-y-1.5">
                  <Label htmlFor="brand" className="text-xs font-semibold">
                    {t("brand")}
                  </Label>
                  {(() => {
                    const selectedBrand = brands.find((b) => b.id === brandId);
                    const brandLabel =
                      brandId === "none" || !brandId
                        ? t("noBrand")
                        : selectedBrand
                        ? selectedBrand.name
                        : t("selectBrand");
                    return (
                      <Popover open={openBrand} onOpenChange={setOpenBrand}>
                        <PopoverTrigger
                          render={
                            <Button
                              id="brand"
                              type="button"
                              variant="outline"
                              role="combobox"
                              aria-expanded={openBrand}
                              className={cn(
                                "w-full justify-between rounded-xl bg-background text-xs font-normal h-9 px-3",
                                (!brandId || brandId === "none") && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">{brandLabel}</span>
                              <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50 ms-2" />
                            </Button>
                          }
                        />
                        <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder={t("searchBrand")} />
                            <CommandList>
                              <CommandEmpty>{t("noBrandFound")}</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value={t("noBrand")}
                                  keywords={["none", "no brand"]}
                                  onSelect={() => {
                                    setBrandId("none");
                                    setOpenBrand(false);
                                  }}
                                >
                                  <span className="flex-1 text-start">{t("noBrand")}</span>
                                  {(!brandId || brandId === "none") && (
                                    <Check className="w-4 h-4 text-primary shrink-0 ms-2" />
                                  )}
                                </CommandItem>
                                {brands.map((b) => (
                                  <CommandItem
                                    key={b.id}
                                    value={b.name}
                                    onSelect={() => {
                                      setBrandId(b.id);
                                      setOpenBrand(false);
                                    }}
                                  >
                                    <span className="flex-1 text-start">{b.name}</span>
                                    {brandId === b.id && (
                                      <Check className="w-4 h-4 text-primary shrink-0 ms-2" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    );
                  })()}
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

                    const priceError =
                      fieldErrors[`variants.${idx}.price_rupees`] ||
                      (fieldErrors.price ? fieldErrors.price : null);

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
                      parseInt(v.stock_quantity || "0", 10) < v.reserved_quantity
                        ? fieldErrors.stock
                        : null);

                    const thresholdError =
                      fieldErrors[`variants.${idx}.low_stock_threshold`] || null;

                    return (
                      <div
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
                          v.is_active
                            ? "bg-card border-border shadow-2xs"
                            : "bg-muted/30 border-dashed border-border/80 opacity-70"
                        }`}
                      >
                        {/* Top: Attribute Chips & Delete Button */}
                        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {Object.entries(v.attributes).length > 0 ? (
                              Object.entries(v.attributes).map(([attrK, attrV]) => (
                                <Badge
                                  key={attrK}
                                  variant="outline"
                                  className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-background/80 border-border"
                                >
                                  <span className="text-muted-foreground font-sans me-1">{attrK}:</span>
                                  <span className="font-semibold text-foreground">{attrV}</span>
                                </Badge>
                              ))
                            ) : (
                              <Badge
                                variant="outline"
                                className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-background/80 border-border text-muted-foreground"
                              >
                                {t("singleDefaultVariant")}
                              </Badge>
                            )}

                            {v.reserved_quantity !== undefined && v.reserved_quantity > 0 && (
                              <Badge variant="secondary" className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                {v.reserved_quantity} {t("reservedStock")}
                              </Badge>
                            )}
                          </div>

                          {variants.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg ms-auto"
                              title={t("removeVariant")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* SKU on its own full-width line (never truncated) */}
                          <div className="w-full space-y-1">
                            <Label
                              htmlFor={`field-variants-${idx}-sku`}
                              className="text-[11px] font-semibold text-muted-foreground"
                            >
                              {t("sku")} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id={`field-variants-${idx}-sku`}
                              value={v.sku}
                              onChange={(e) => updateVariantField(idx, "sku", e.target.value)}
                              placeholder="e.g. MK-01-BLU"
                              className={`w-full h-9 font-mono text-xs rounded-xl ${
                                skuError
                                  ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                                  : ""
                              }`}
                            />
                            {skuError && (
                              <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                {skuError}
                              </p>
                            )}
                          </div>

                          {/* Price / original price / stock / low-stock threshold / active in a responsive grid that stacks on mobile */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
                            {/* Price */}
                            <div className="space-y-1">
                              <Label
                                htmlFor={`field-variants-${idx}-price_rupees`}
                                className="text-[11px] font-semibold text-muted-foreground"
                              >
                                {t("priceRupees")} <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`field-variants-${idx}-price_rupees`}
                                type="text"
                                inputMode="numeric"
                                value={v.price_rupees}
                                onChange={(e) =>
                                  updateVariantField(idx, "price_rupees", e.target.value)
                                }
                                placeholder="0"
                                className={`h-9 font-mono text-xs rounded-xl ${
                                  priceError
                                    ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                                    : ""
                                }`}
                              />
                              {priceError && (
                                <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  {priceError}
                                </p>
                              )}
                            </div>

                            {/* Compare At / Original Price */}
                            <div className="space-y-1">
                              <Label
                                htmlFor={`field-variants-${idx}-compare_at_rupees`}
                                className="text-[11px] font-semibold text-muted-foreground"
                              >
                                {t("compareAtRupees")}
                              </Label>
                              <Input
                                id={`field-variants-${idx}-compare_at_rupees`}
                                type="text"
                                inputMode="numeric"
                                value={v.compare_at_rupees}
                                onChange={(e) =>
                                  updateVariantField(idx, "compare_at_rupees", e.target.value)
                                }
                                placeholder="0"
                                className={`h-9 font-mono text-xs rounded-xl ${
                                  compareError
                                    ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                                    : ""
                                }`}
                              />
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                {t("originalPriceHelp")}
                              </p>
                              {compareError && (
                                <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  {compareError}
                                </p>
                              )}
                            </div>

                            {/* Stock Quantity */}
                            <div className="space-y-1">
                              <Label
                                htmlFor={`field-variants-${idx}-stock_quantity`}
                                className="text-[11px] font-semibold text-muted-foreground"
                              >
                                {t("stock")} <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`field-variants-${idx}-stock_quantity`}
                                type="text"
                                inputMode="numeric"
                                value={v.stock_quantity}
                                onChange={(e) =>
                                  updateVariantField(idx, "stock_quantity", e.target.value)
                                }
                                placeholder="0"
                                className={`h-9 font-mono text-xs rounded-xl ${
                                  stockError
                                    ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                                    : ""
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
                              <Label
                                htmlFor={`field-variants-${idx}-low_stock_threshold`}
                                className="text-[11px] font-semibold text-muted-foreground"
                              >
                                {t("lowStockThreshold")}
                              </Label>
                              <Input
                                id={`field-variants-${idx}-low_stock_threshold`}
                                type="text"
                                inputMode="numeric"
                                value={v.low_stock_threshold}
                                onChange={(e) =>
                                  updateVariantField(idx, "low_stock_threshold", e.target.value)
                                }
                                placeholder="0"
                                className={`h-9 font-mono text-xs rounded-xl ${
                                  thresholdError
                                    ? "border-destructive focus-visible:ring-destructive ring-1 ring-destructive"
                                    : ""
                                }`}
                              />
                              {thresholdError && (
                                <p className="text-[10px] text-destructive flex items-center gap-1 leading-tight">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  {thresholdError}
                                </p>
                              )}
                            </div>

                            {/* Active Status */}
                            <div className="space-y-1 flex flex-col justify-start">
                              <Label
                                htmlFor={`field-variants-${idx}-active`}
                                className="text-[11px] font-semibold text-muted-foreground"
                              >
                                {t("status")}
                              </Label>
                              <label
                                htmlFor={`field-variants-${idx}-active`}
                                className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border/80 bg-background/50 hover:bg-background cursor-pointer text-xs font-medium transition-colors"
                              >
                                <input
                                  id={`field-variants-${idx}-active`}
                                  type="checkbox"
                                  checked={v.is_active}
                                  onChange={(e) =>
                                    updateVariantField(idx, "is_active", e.target.checked)
                                  }
                                  className="rounded text-primary focus:ring-primary h-4 w-4"
                                />
                                <span>{t("active")}</span>
                              </label>
                            </div>
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
          <Card id="field-product-images" className="rounded-3xl border-border/80 shadow-2xs">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-lg">{t("productImages")}</CardTitle>
              <CardDescription>{t("imagesMaxNotice")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fieldErrors.images && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fieldErrors.images}</span>
                </div>
              )}
              {product?.id ? (
                <>
                  {/* Upload Drop Zone / Button */}
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isAnyImageActionPending || images.length >= 8}
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="product-images-input"
                    />

                    <label
                      htmlFor="product-images-input"
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border/80 transition-colors text-center ${
                        isAnyImageActionPending || images.length >= 8
                          ? "opacity-50 cursor-not-allowed bg-muted/20"
                          : "hover:border-primary/50 hover:bg-primary/5 bg-card cursor-pointer"
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
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          {t("dragToReorder")}
                        </p>
                        {isReorderingImages && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-primary font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving order...</span>
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {images.map((img, idx) => {
                          const isBeingDeleted = deletingImageId === img.id;
                          return (
                            <div
                              key={img.id}
                              draggable={!isAnyImageActionPending && !isBeingDeleted}
                              onDragStart={() => handleDragStart(idx)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(idx)}
                              className={`relative flex items-center gap-3 p-2.5 rounded-xl border bg-card transition-all ${
                                isAnyImageActionPending
                                  ? "opacity-75 cursor-not-allowed"
                                  : "cursor-grab active:cursor-grabbing hover:border-primary/40 shadow-xs"
                              } ${
                                draggedImageIndex === idx
                                  ? "border-primary scale-[1.02] shadow-md"
                                  : "border-border/80"
                              }`}
                            >
                              {isBeingDeleted && (
                                <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex items-center justify-center gap-2 text-xs text-destructive font-semibold z-10 rounded-xl">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>{t("deleting")}</span>
                                </div>
                              )}

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
                                  disabled={isAnyImageActionPending || idx === 0}
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
                                  disabled={isAnyImageActionPending || idx === images.length - 1}
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
                                  disabled={isAnyImageActionPending}
                                  onClick={() => setImageToDelete(img)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  title={t("delete")}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
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
                <>
                  {/* New Product: Queued Image Dropzone */}
                  <div className="space-y-2">
                    <input
                      ref={queuedFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isSaving || isUploadingImages || queuedImages.length >= 8}
                      onChange={handleQueuedImageFileChange}
                      className="hidden"
                      id="queued-images-input"
                    />

                    <label
                      htmlFor="queued-images-input"
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-border/80 transition-colors text-center ${
                        isSaving || isUploadingImages || queuedImages.length >= 8
                          ? "opacity-50 cursor-not-allowed bg-muted/20"
                          : "hover:border-primary/50 hover:bg-primary/5 bg-card cursor-pointer"
                      }`}
                    >
                      {isUploadingImages ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <span className="text-xs font-medium text-foreground">
                            {uploadProgressText || "Uploading queued images..."}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-primary block">
                              {queuedImages.length >= 8 ? "Max 8 Images Selected" : t("uploadImage")}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {queuedImages.length}/8 selected · Uploaded automatically on save
                            </span>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Queued Images List */}
                  {queuedImages.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          Queued photos (first is main)
                        </p>
                      </div>

                      <div className="space-y-2">
                        {queuedImages.map((q, idx) => (
                          <div
                            key={q.id}
                            className="relative flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-card transition-all shadow-xs"
                          >
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.previewUrl}
                                alt={`Queued photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
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
                              <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                                {q.file.name}
                              </p>
                            </div>

                            {/* Move & Remove Controls */}
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleMoveQueuedImage(idx, "prev")}
                                className="h-7 w-7 p-0 text-muted-foreground"
                                title="Move up"
                              >
                                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleMoveQueuedImage(idx, "next")}
                                className="h-7 w-7 p-0 text-muted-foreground"
                                title="Move down"
                              >
                                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isSaving}
                                onClick={() => handleRemoveQueuedImage(idx)}
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
                      <p className="text-xs text-muted-foreground">No photos selected yet</p>
                    </div>
                  )}
                </>
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
        onOpenChange={(open) => {
          if (!open) setImageToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteImageTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteImageDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteImage}>
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
