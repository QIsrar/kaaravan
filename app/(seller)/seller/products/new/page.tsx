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

  const leafCategories = (allCategories || [])
    .filter((c) => !parentIdSet.has(c.id))
    .map((c) => {
      const parent = c.parent_id ? categoryMap.get(c.parent_id) : null;
      return {
        id: c.id,
        name: c.name,
        parentName: parent ? parent.name : "General",
      };
    })
    .sort((a, b) => a.parentName.localeCompare(b.parentName) || a.name.localeCompare(b.name));

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
