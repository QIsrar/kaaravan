/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

export function getPublicImageUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder-product.svg";
  if (path.startsWith("/") || path.startsWith("http")) return path;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return path;

  // If path already starts with a known bucket
  if (path.startsWith("product-images/") || path.startsWith("banners/") || path.startsWith("avatars/")) {
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
  }

  const parts = path.split("/");
  if (parts.length > 2 && (parts[0] === "product-images" || parts[0] === "banners" || parts[0] === "avatars")) {
    const bucket = parts.shift();
    const rest = parts.join("/");
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${rest}`;
  }

  // Otherwise, default to product-images bucket
  return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`;
}
