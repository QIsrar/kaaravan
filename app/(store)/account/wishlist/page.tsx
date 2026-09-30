import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getWishlist } from "@/lib/services/customer_accounts";
import { WishlistManager, type WishlistItem } from "@/components/store/wishlist-manager";

export default async function CustomerWishlistPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const supabase = await createClient();
  const wishlist = await getWishlist(supabase, profile.id);

  return <WishlistManager initialItems={(wishlist as unknown as WishlistItem[]) || []} />;
}
