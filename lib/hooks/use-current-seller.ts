/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentSellerAction } from "@/lib/actions/auth";

export interface CurrentSellerData {
  id: string;
  business_name: string;
  status: string;
}

export function useCurrentSeller() {
  return useQuery<CurrentSellerData | null>({
    queryKey: ["current-seller"],
    queryFn: async () => {
      const seller = await getCurrentSellerAction();
      return seller;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
