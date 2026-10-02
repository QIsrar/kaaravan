import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Search, AlertCircle, Package2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getPublicImageUrl } from "@/lib/format/image-url";
import { ProductsFilter } from "./products-filter";

export default async function SellerProductsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const profile = await requireAuth(["seller"]);
  const sellerId = profile.seller_id as string;
  const t = await getTranslations("seller");
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";

  const supabase = await createClient();

  // We should verify if the seller is approved and not suspended
  const { data: seller } = await supabase
    .from("sellers")
    .select("status")
    .eq("id", sellerId)
    .single();

  if (!seller || seller.status !== "approved") {
    // Or we could show an error state
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Account Not Active</h2>
        <p className="text-muted-foreground">You must be an approved seller to manage products.</p>
      </div>
    );
  }

  let dbQuery = supabase
    .from("products")
    .select(`
      id, title, slug, status, created_at,
      product_images ( path, sort_order ),
      product_variants ( id, stock_quantity, reserved_quantity, low_stock_threshold )
    `)
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }

  if (statusFilter !== "all") {
    type ProductStatus = "rejected" | "draft" | "pending_review" | "active" | "archived";
    dbQuery = dbQuery.eq("status", statusFilter as ProductStatus);
  }

  const { data: productsData, error } = await dbQuery;

  if (error) {
    return <div>Error loading products.</div>;
  }

  const formatStatus = (s: string) => {
    switch(s) {
      case "active": return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Active</Badge>;
      case "pending_review": return <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">Pending Review</Badge>;
      case "draft": return <Badge variant="secondary">Draft</Badge>;
      case "archived": return <Badge variant="outline">Archived</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your catalog, stock and prices</p>
        </div>
        <Link href="/seller/products/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      <ProductsFilter />

      <div className="space-y-4">
        {productsData.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-sm text-muted-foreground">Get started by creating your first product.</p>
          </div>
        ) : (
          productsData.map((product) => {
            const mainImage = product.product_images?.sort((a: {sort_order: number}, b: {sort_order: number}) => a.sort_order - b.sort_order)[0]?.path;
            
            // Calculate total stock
            let totalStock = 0;
            let hasLowStock = false;
            
            product.product_variants?.forEach((v: {stock_quantity: number, reserved_quantity: number, low_stock_threshold: number}) => {
              const available = v.stock_quantity - v.reserved_quantity;
              totalStock += available;
              if (available <= v.low_stock_threshold) {
                hasLowStock = true;
              }
            });

            return (
              <Card key={product.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
                    <div className="w-full sm:w-24 h-24 relative bg-secondary/20 rounded-lg overflow-hidden shrink-0">
                      {mainImage ? (
                        <Image
                          src={getPublicImageUrl(mainImage)}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <Link href={`/seller/products/${product.id}`} className="font-medium text-lg hover:text-primary truncate" dir="auto">
                          {product.title}
                        </Link>
                        <div>{formatStatus(product.status)}</div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{product.product_variants?.length || 0} variants</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{totalStock} in stock</span>
                          {hasLowStock && (
                            <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 mt-4 sm:mt-0 flex gap-2">
                      <Link href={`/seller/products/${product.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
