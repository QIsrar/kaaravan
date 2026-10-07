import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, AlertCircle, Package2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/format/image-url";
import { ProductsFilter } from "./products-filter";
import { InlineStockEditor, VariantStockItem } from "./inline-stock-editor";

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const profile = await requireAuth(["seller"]);
  const sellerId = profile.seller_id as string;
  const t = await getTranslations("seller.catalog");
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";

  const supabase = await createClient();

  const { data: seller } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", sellerId)
    .single();

  if (!seller || seller.status !== "approved") {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold font-heading">Account Not Active</h2>
        <p className="text-sm text-muted-foreground">
          You must be an approved seller to manage products and inventory.
        </p>
      </div>
    );
  }

  let dbQuery = supabase
    .from("products")
    .select(`
      id, title, slug, status, created_at,
      product_images ( path, sort_order ),
      product_variants ( id, sku, stock_quantity, reserved_quantity, low_stock_threshold, attributes )
    `)
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  if (statusFilter === "all") {
    dbQuery = dbQuery.neq("status", "archived");
  } else {
    type ProductStatus = "rejected" | "draft" | "pending_review" | "active" | "archived";
    dbQuery = dbQuery.eq("status", statusFilter as ProductStatus);
  }

  const { data: productsData, error } = await dbQuery;

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load catalog products. Please refresh the page.
      </div>
    );
  }

  const formatStatus = (s: string) => {
    switch (s) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold px-2.5 py-0.5 text-xs">
            {t("statusActive")}
          </Badge>
        );
      case "pending_review":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold px-2.5 py-0.5 text-xs">
            {t("statusPendingReview")}
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary" className="font-semibold px-2.5 py-0.5 text-xs">
            {t("statusDraft")}
          </Badge>
        );
      case "archived":
        return (
          <Badge variant="outline" className="text-muted-foreground font-semibold px-2.5 py-0.5 text-xs">
            {t("statusArchived")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="font-semibold px-2.5 py-0.5 text-xs">
            {t("statusRejected")}
          </Badge>
        );
      default:
        return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{t("products")}</h1>
          <p className="text-sm text-muted-foreground">{t("productsSubtitle")}</p>
        </div>
        <Link href="/seller/products/new" className={buttonVariants({ className: "rounded-xl" })}>
          <Plus className="w-4 h-4 me-2" />
          {t("addProduct")}
        </Link>
      </div>

      <ProductsFilter />

      <div className="space-y-4">
        {!productsData || productsData.length === 0 ? (
          <div className="text-center py-16 px-4 bg-card rounded-3xl border border-dashed border-border shadow-2xs">
            <Package2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-heading font-medium text-foreground">{t("noProductsFound")}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{t("noProductsDesc")}</p>
          </div>
        ) : (
          productsData.map((product) => {
            const sortedImages = [...(product.product_images || [])].sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const mainImage = sortedImages[0]?.path;

            // Calculate total stock
            let totalAvailable = 0;
            let hasLowStock = false;

            product.product_variants?.forEach((v) => {
              const available = v.stock_quantity - v.reserved_quantity;
              totalAvailable += available;
              if (available <= v.low_stock_threshold) {
                hasLowStock = true;
              }
            });

            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:border-primary/40 transition-colors rounded-2xl shadow-2xs"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 relative bg-muted/40 rounded-xl overflow-hidden shrink-0 border border-border/60">
                      {mainImage ? (
                        <Image
                          src={getPublicImageUrl(mainImage)}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <Link
                          href={`/seller/products/${product.id}`}
                          className="font-heading font-semibold text-lg hover:text-primary transition-colors truncate"
                          dir="auto"
                        >
                          {product.title}
                        </Link>
                        <div>{formatStatus(product.status)}</div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span>{t("variantsCount", { count: product.product_variants?.length || 0 })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono">{t("inStockCount", { count: totalAvailable })}</span>
                          {hasLowStock && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ms-1">
                              {t("lowStockBadge")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0 flex gap-2">
                      <Link
                        href={`/seller/products/${product.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-xl text-xs w-full sm:w-auto" })}
                      >
                        {t("editProduct")}
                      </Link>
                    </div>
                  </div>

                  {/* Inline Quick Stock Editor */}
                  {product.product_variants && product.product_variants.length > 0 && (
                    <InlineStockEditor
                      productId={product.id}
                      variants={product.product_variants as VariantStockItem[]}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
