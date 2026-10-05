import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProductForm, ProductInitialData } from "./product-form";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAuth(["seller"]);
  const sellerId = profile.seller_id as string;
  const productId = (await params).id;

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id, title, description, category_id, brand_id, status,
      product_variants ( id, sku, price_minor, compare_at_minor, stock_quantity, reserved_quantity, low_stock_threshold, attributes, is_active ),
      product_images ( id, path, sort_order )
    `)
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .single();

  if (error || !product) {
    notFound();
  }

  // Active leaf categories only
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  const parentIdSet = new Set((allCategories || []).map((c) => c.parent_id).filter(Boolean));
  const categoryMap = new Map((allCategories || []).map((c) => [c.id, c]));

  const getCategoryHierarchy = (cat: { id: string; name: string; parent_id: string | null }): string => {
    if (!cat.parent_id || !categoryMap.has(cat.parent_id)) return cat.name;
    return `${getCategoryHierarchy(categoryMap.get(cat.parent_id)!)} > ${cat.name}`;
  };

  const leafCategories = (allCategories || [])
    .filter((c) => !parentIdSet.has(c.id))
    .map((c) => ({
      id: c.id,
      name: getCategoryHierarchy(c),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <div className="max-w-5xl mx-auto">
      <ProductForm 
        product={product as unknown as ProductInitialData} 
        categories={leafCategories} 
        brands={brands || []} 
        sellerId={sellerId}
      />
    </div>
  );
}
