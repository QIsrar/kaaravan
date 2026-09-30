/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  getWishlistVariantIdsAction,
  addToWishlistAction,
  removeFromWishlistAction,
} from "@/lib/actions/customer_accounts";

export const WISHLIST_QUERY_KEY = ["wishlist-ids"] as const;

export function useWishlistQuery() {
  return useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: () => getWishlistVariantIdsAction(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWishlist() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("wishlist");

  const { data: wishlistIds = [] } = useWishlistQuery();
  const wishlistSet = new Set(wishlistIds);

  const isWishlisted = (variantId: string) => wishlistSet.has(variantId);

  const mutation = useMutation({
    mutationFn: async ({
      variantId,
      currentlySaved,
    }: {
      variantId: string;
      currentlySaved: boolean;
    }) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("UNAUTHENTICATED");
      }

      if (currentlySaved) {
        await removeFromWishlistAction(variantId);
        return { variantId, action: "removed" as const };
      } else {
        await addToWishlistAction(variantId);
        return { variantId, action: "added" as const };
      }
    },
    onMutate: async ({ variantId, currentlySaved }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const previous = queryClient.getQueryData<string[]>(WISHLIST_QUERY_KEY) || [];

      if (currentlySaved) {
        queryClient.setQueryData<string[]>(
          WISHLIST_QUERY_KEY,
          previous.filter((id) => id !== variantId)
        );
      } else {
        queryClient.setQueryData<string[]>(WISHLIST_QUERY_KEY, [...previous, variantId]);
      }

      return { previous };
    },
    onSuccess: (result) => {
      if (result.action === "added") {
        toast.success(t("addedSuccess"));
      } else {
        toast.info(t("removedSuccess"));
      }
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WISHLIST_QUERY_KEY, context.previous);
      }

      if (err instanceof Error && err.message === "UNAUTHENTICATED") {
        toast.info(t("signInRequired"));
        const redirect = encodeURIComponent(pathname || "/");
        router.push(`/login?redirect=${redirect}`);
      } else {
        toast.error("Could not update wishlist. Please try again.");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
    },
  });

  const toggleWishlist = (variantId: string) => {
    const currentlySaved = isWishlisted(variantId);
    mutation.mutate({ variantId, currentlySaved });
  };

  return {
    isWishlisted,
    toggleWishlist,
    isPending: mutation.isPending,
  };
}
