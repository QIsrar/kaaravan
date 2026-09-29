import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

async function test() {
  const sanitized = "Peshawari Chappal";
  const { data, error } = await sb
    .from("products")
    .select(`
      id,
      title,
      slug,
      rating_avg,
      rating_count,
      seller:sellers (
        id,
        business_name,
        slug,
        status
      ),
      variants:product_variants (
        id,
        sku,
        price_minor,
        compare_at_minor,
        is_active
      ),
      images:product_images (
        path,
        sort_order
      )
    `)
    .eq("status", "active")
    .is("deleted_at", null)
    .or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
    .limit(40);

  console.log("Error:", error);
  console.log("Data count:", data ? data.length : null);
}

test();
