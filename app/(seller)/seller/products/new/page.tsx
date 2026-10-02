import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../[id]/product-form";

export default async function NewProductPage() {
  const profile = await requireAuth(["seller"]);
  const sellerId = profile.seller_id as string;

  const supabase = await createClient();

  const { data: categories } = await supabase.from("categories").select("id, name").eq("is_active", true);
  const { data: brands } = await supabase.from("brands").select("id, name").is("deleted_at", null);

  return (
    <div className="max-w-4xl mx-auto">
      <ProductForm 
        categories={categories || []} 
        brands={brands || []} 
        sellerId={sellerId}
      />
    </div>
  );
}
