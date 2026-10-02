/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

export function getPublicImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-image.jpg";
  if (path.startsWith("/") || path.startsWith("http")) return path;
  
  // Format is typically bucket/seller_id/product_id/uuid.webp
  // We construct the public URL using NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;

  // Assuming path is like "product-images/..."
  // Supabase public URL format: [project_url]/storage/v1/object/public/[bucket]/[path]
  const parts = path.split("/");
  const bucket = parts.shift();
  const rest = parts.join("/");
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${rest}`;
}
