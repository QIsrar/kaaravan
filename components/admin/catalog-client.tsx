"use client";

import React, { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  createCategoryAction,
  updateCategoryAction,
  createBrandAction,
  deleteBrandAction,
  createSynonymAction,
  deleteSynonymAction,
} from "@/lib/actions/admin";
import {
  FolderTree,
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  commission_rate_bps: number | null;
  sort_order: number;
  is_active: boolean;
}

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  created_at: string;
}

interface SynonymItem {
  id: string;
  term: string;
  maps_to: string;
  created_at: string;
}

interface CatalogClientProps {
  initialCategories: CategoryItem[];
  initialBrands: BrandItem[];
  initialSynonyms: SynonymItem[];
}

export function CatalogClient({
  initialCategories,
  initialBrands,
  initialSynonyms,
}: CatalogClientProps) {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<"categories" | "brands" | "synonyms">("categories");

  // State
  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState(initialBrands);
  const [synonyms, setSynonyms] = useState(initialSynonyms);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catCommBps, setCatCommBps] = useState("");
  const [catSortOrder, setCatSortOrder] = useState("0");
  const [catIsActive, setCatIsActive] = useState(true);

  // Brand modal state
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandSlug, setBrandSlug] = useState("");

  // Synonym modal state
  const [isSynonymModalOpen, setIsSynonymModalOpen] = useState(false);
  const [synTerm, setSynTerm] = useState("");
  const [synMapsTo, setSynMapsTo] = useState("");

  const [isPending, startTransition] = useTransition();

  // Category Columns
  const categoryColumns: ColumnDef<CategoryItem>[] = [
    {
      header: "Category Name",
      cell: (row) => {
        const isChild = !!row.parent_id;
        return (
          <div className={`flex items-center gap-2 ${isChild ? "ps-6 text-foreground" : "font-bold text-foreground"}`}>
            {isChild && <span className="text-muted-foreground">└</span>}
            <span>{row.name}</span>
            <span className="text-[11px] font-normal text-muted-foreground font-mono">
              /{row.slug}
            </span>
          </div>
        );
      },
    },
    {
      header: "Commission Rate",
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.commission_rate_bps !== null
            ? `${(row.commission_rate_bps / 100).toFixed(1)}%`
            : "Platform Default"}
        </span>
      ),
    },
    {
      header: "Sort Order",
      accessorKey: "sort_order",
      cell: (row) => <span className="font-mono text-xs">{row.sort_order}</span>,
    },
    {
      header: t("status"),
      cell: (row) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.is_active
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingCategory(row);
              setCatName(row.name);
              setCatSlug(row.slug);
              setCatParentId(row.parent_id || "");
              setCatCommBps(row.commission_rate_bps !== null ? String(row.commission_rate_bps) : "");
              setCatSortOrder(String(row.sort_order));
              setCatIsActive(row.is_active);
              setIsCategoryModalOpen(true);
            }}
            className="h-8 px-2.5 text-xs rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5 me-1 text-primary" />
            Edit
          </Button>
        </div>
      ),
    },
  ];

  // Brand Columns
  const brandColumns: ColumnDef<BrandItem>[] = [
    {
      header: "Brand Name",
      cell: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <p className="text-[11px] text-muted-foreground">/{row.slug}</p>
        </div>
      ),
    },
    {
      header: t("created"),
      cell: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {row.created_at.split("T")[0]}
        </span>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            startTransition(async () => {
              await deleteBrandAction(row.id);
              setBrands((prev) => prev.filter((b) => b.id !== row.id));
            });
          }}
          disabled={isPending}
          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5 me-1" />
          Remove
        </Button>
      ),
    },
  ];

  // Synonym Columns
  const synonymColumns: ColumnDef<SynonymItem>[] = [
    {
      header: "Search Term",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          &quot;{row.term}&quot;
        </span>
      ),
    },
    {
      header: "Maps To",
      cell: (row) => (
        <span className="font-medium text-foreground text-xs">
          → {row.maps_to}
        </span>
      ),
    },
    {
      header: t("created"),
      cell: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {row.created_at.split("T")[0]}
        </span>
      ),
    },
    {
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            startTransition(async () => {
              await deleteSynonymAction(row.id);
              setSynonyms((prev) => prev.filter((s) => s.id !== row.id));
            });
          }}
          disabled={isPending}
          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5 me-1" />
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
          {[
            { label: "Category Tree", value: "categories", icon: FolderTree },
            { label: "Brands", value: "brands", icon: Tag },
            { label: "Search Synonyms", value: "synonyms", icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value as "categories" | "brands" | "synonyms")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action button */}
        {activeTab === "categories" && (
          <Button
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setCatName("");
              setCatSlug("");
              setCatParentId("");
              setCatCommBps("");
              setCatSortOrder("0");
              setCatIsActive(true);
              setIsCategoryModalOpen(true);
            }}
            className="text-xs h-9 font-semibold"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Add Category
          </Button>
        )}
        {activeTab === "brands" && (
          <Button
            size="sm"
            onClick={() => setIsBrandModalOpen(true)}
            className="text-xs h-9 font-semibold"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Add Brand
          </Button>
        )}
        {activeTab === "synonyms" && (
          <Button
            size="sm"
            onClick={() => setIsSynonymModalOpen(true)}
            className="text-xs h-9 font-semibold"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Add Synonym
          </Button>
        )}
      </div>

      {/* Categories View */}
      {activeTab === "categories" && (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={categoryColumns}
              data={categories}
              searchPlaceholder="Search categories by name..."
              searchFilter={(item, query) =>
                item.name.toLowerCase().includes(query) ||
                item.slug.toLowerCase().includes(query)
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Brands View */}
      {activeTab === "brands" && (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={brandColumns}
              data={brands}
              searchPlaceholder="Search brands..."
              searchFilter={(item, query) =>
                item.name.toLowerCase().includes(query)
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Synonyms View */}
      {activeTab === "synonyms" && (
        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={synonymColumns}
              data={synonyms}
              searchPlaceholder="Search synonyms..."
              searchFilter={(item, query) =>
                item.term.toLowerCase().includes(query) ||
                item.maps_to.toLowerCase().includes(query)
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading text-lg font-bold text-foreground">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCategory) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cat-slug">URL Slug</Label>
                <Input
                  id="cat-slug"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cat-parent">Parent Category (optional)</Label>
                <select
                  id="cat-parent"
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-card text-foreground mt-1"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label htmlFor="cat-bps">Category Commission (bps, e.g. 700 = 7.0%)</Label>
                <Input
                  id="cat-bps"
                  type="number"
                  value={catCommBps}
                  onChange={(e) => setCatCommBps(e.target.value)}
                  placeholder="Leave empty for platform default"
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cat-order">Sort Order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="cat-active"
                  checked={catIsActive}
                  onChange={(e) => setCatIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="cat-active">Active and displayed in storefront</Label>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!catName.trim() || !catSlug.trim()) return;
                  const comm = catCommBps ? parseInt(catCommBps, 10) : null;
                  const sort = parseInt(catSortOrder, 10) || 0;

                  startTransition(async () => {
                    if (editingCategory) {
                      await updateCategoryAction(editingCategory.id, {
                        name: catName.trim(),
                        slug: catSlug.trim(),
                        parentId: catParentId || null,
                        commissionRateBps: comm,
                        sortOrder: sort,
                        isActive: catIsActive,
                      });
                      setCategories((prev) =>
                        prev.map((c) =>
                          c.id === editingCategory.id
                            ? {
                                ...c,
                                name: catName.trim(),
                                slug: catSlug.trim(),
                                parent_id: catParentId || null,
                                commission_rate_bps: comm,
                                sort_order: sort,
                                is_active: catIsActive,
                              }
                            : c
                        )
                      );
                    } else {
                      const res = await createCategoryAction({
                        name: catName.trim(),
                        slug: catSlug.trim(),
                        parentId: catParentId || null,
                        commissionRateBps: comm,
                        sortOrder: sort,
                        isActive: catIsActive,
                      });
                      setCategories((prev) => [
                        ...prev,
                        {
                          id: res.categoryId,
                          name: catName.trim(),
                          slug: catSlug.trim(),
                          parent_id: catParentId || null,
                          commission_rate_bps: comm,
                          sort_order: sort,
                          is_active: catIsActive,
                        },
                      ]);
                    }
                    setIsCategoryModalOpen(false);
                  });
                }}
                disabled={isPending}
                className="text-xs h-9"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Add Brand
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => {
                    setBrandName(e.target.value);
                    setBrandSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="brand-slug">Slug</Label>
                <Input
                  id="brand-slug"
                  value={brandSlug}
                  onChange={(e) => setBrandSlug(e.target.value)}
                  className="h-8 text-xs font-mono mt-1"
                  required
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBrandModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!brandName.trim()) return;
                  startTransition(async () => {
                    const res = await createBrandAction({
                      name: brandName.trim(),
                      slug: brandSlug.trim(),
                    });
                    setBrands((prev) => [
                      ...prev,
                      {
                        id: res.brandId,
                        name: brandName.trim(),
                        slug: brandSlug.trim(),
                        logo: null,
                        created_at: new Date().toISOString(),
                      },
                    ]);
                    setIsBrandModalOpen(false);
                    setBrandName("");
                    setBrandSlug("");
                  });
                }}
                disabled={isPending}
                className="text-xs h-9"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Brand"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Synonym Modal */}
      {isSynonymModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95">
            <h3 className="font-heading text-lg font-bold text-foreground">
              Add Search Synonym
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="syn-term">Search Term (e.g. shalwar)</Label>
                <Input
                  id="syn-term"
                  value={synTerm}
                  onChange={(e) => setSynTerm(e.target.value)}
                  placeholder="e.g. shalwar"
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="syn-maps">Maps To (canonical, e.g. salwar)</Label>
                <Input
                  id="syn-maps"
                  value={synMapsTo}
                  onChange={(e) => setSynMapsTo(e.target.value)}
                  placeholder="e.g. salwar"
                  className="h-8 text-xs mt-1"
                  required
                />
              </div>
            </div>
            <div className="pt-2 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSynonymModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!synTerm.trim() || !synMapsTo.trim()) return;
                  startTransition(async () => {
                    const res = await createSynonymAction({
                      term: synTerm.trim(),
                      mapsTo: synMapsTo.trim(),
                    });
                    setSynonyms((prev) => [
                      ...prev,
                      {
                        id: res.synonymId,
                        term: synTerm.trim(),
                        maps_to: synMapsTo.trim(),
                        created_at: new Date().toISOString(),
                      },
                    ]);
                    setIsSynonymModalOpen(false);
                    setSynTerm("");
                    setSynMapsTo("");
                  });
                }}
                disabled={isPending}
                className="text-xs h-9"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Synonym"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
