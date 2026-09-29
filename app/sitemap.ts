import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kaaravan.pk";
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sell`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  try {
    const supabase = createAdminClient();

    // 1. Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true)
      .is("deleted_at", null);

    for (const cat of categories || []) {
      routes.push({
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(cat.updated_at || Date.now()),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // 2. Products
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(200);

    for (const p of products || []) {
      routes.push({
        url: `${baseUrl}/product/${p.slug}`,
        lastModified: new Date(p.updated_at || Date.now()),
        changeFrequency: "daily",
        priority: 0.9,
      });
    }

    // 3. Sellers
    const { data: sellers } = await supabase
      .from("sellers")
      .select("slug, updated_at")
      .eq("status", "approved")
      .is("deleted_at", null);

    for (const s of sellers || []) {
      routes.push({
        url: `${baseUrl}/store/${s.slug}`,
        lastModified: new Date(s.updated_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (err) {
    console.error("Sitemap generation error:", err);
  }

  return routes;
}
