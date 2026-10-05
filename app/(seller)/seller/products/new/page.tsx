import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../[id]/product-form";

export default async function NewProductPage() {
  const profile = await requireAuth(["seller"]);
  const sellerId = profile.seller_id as string;

  const supabase = await createClient();

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
        categories={leafCategories} 
        brands={brands || []} 
        sellerId={sellerId}
      />
    </div>
  );
}
