"use client";

import { useQuery } from "@tanstack/react-query";
import { getCartAction } from "@/lib/actions/cart";

export const CART_QUERY_KEY = ["cart"] as const;

export function useCartQuery() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartAction(),
  });
}

export function useCartTotalItems(): number {
  const { data } = useCartQuery();
  return data?.totalItems ?? 0;
}
