import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "./product-form";
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
      product_variants ( id, sku, price_minor, compare_at_minor, stock_quantity, low_stock_threshold, attributes, is_active ),
      product_images ( id, image_path, sort_order )
    `)
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .is("deleted_at", null)
    .single();

  if (error || !product) {
    notFound();
  }

  const { data: categories } = await supabase.from("categories").select("id, name").eq("is_active", true);
  const { data: brands } = await supabase.from("brands").select("id, name").is("deleted_at", null);

  return (
    <div className="max-w-4xl mx-auto">
      <ProductForm 
        product={product} 
        categories={categories || []} 
        brands={brands || []} 
        sellerId={sellerId}
      />
    </div>
  );
}
