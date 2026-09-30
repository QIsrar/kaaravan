/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface CurrentSellerData {
  id: string;
  business_name: string;
  status: string;
}

export function useCurrentSeller() {
  return useQuery<CurrentSellerData | null>({
    queryKey: ["current-seller"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: seller } = await supabase
        .from("sellers")
        .select("id, business_name, status")
        .eq("owner_profile_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      return seller || null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
