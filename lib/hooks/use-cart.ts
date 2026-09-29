"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  getCartAction,
  addToCartAction,
  updateCartItemAction,
  removeFromCartAction,
  clearCartAction,
} from "@/lib/actions/cart";
import type { CartDetails } from "@/lib/services/cart";
import {
  optimisticAddToCart,
  optimisticSetQuantity,
  optimisticRemove,
  optimisticClear,
  type OptimisticAddItem,
} from "@/lib/store/cart-optimistic";

export const CART_QUERY_KEY = ["cart"] as const;

export function useCartQuery(initialData?: CartDetails | null) {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartAction(),
    ...(initialData !== undefined ? { initialData } : {}),
  });
}

export function useCartTotalItems(): number {
  const { data } = useCartQuery();
  return data?.totalItems ?? 0;
}

interface MutationContext {
  previous: CartDetails | null | undefined;
}

/**
 * Adds an item to the cart. The cache (and therefore the header badge, the
 * cart page, and any other reader) updates instantly via onMutate; onSuccess
 * replaces the optimistic guess with the server's authoritative cart the
 * moment the request resolves, and onError rolls back and shows a toast.
 */
export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations("store");

  return useMutation({
    mutationFn: (vars: { variantId: string; quantity: number; optimistic: OptimisticAddItem }) =>
      addToCartAction({ variantId: vars.variantId, quantity: vars.quantity }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartDetails | null>(CART_QUERY_KEY);
      queryClient.setQueryData(CART_QUERY_KEY, optimisticAddToCart(previous, vars.optimistic));
      return { previous } satisfies MutationContext;
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(CART_QUERY_KEY, context?.previous);
      toast.error(err instanceof Error ? err.message : t("addToCartError"));
    },
    onSuccess: (result) => {
      if (result.cartDetails) {
        queryClient.setQueryData(CART_QUERY_KEY, result.cartDetails);
      }
    },
  });
}

export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations("store");

  return useMutation({
    mutationFn: (vars: { variantId: string; quantity: number }) => updateCartItemAction(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartDetails | null>(CART_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(
          CART_QUERY_KEY,
          optimisticSetQuantity(previous, vars.variantId, vars.quantity)
        );
      }
      return { previous } satisfies MutationContext;
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(CART_QUERY_KEY, context?.previous);
      toast.error(err instanceof Error ? err.message : t("updateQuantityError"));
    },
    onSuccess: (result) => {
      if (result.cartDetails) {
        queryClient.setQueryData(CART_QUERY_KEY, result.cartDetails);
      }
    },
  });
}

export function useRemoveFromCartMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations("store");

  return useMutation({
    mutationFn: (vars: { variantId: string }) => removeFromCartAction(vars),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartDetails | null>(CART_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(CART_QUERY_KEY, optimisticRemove(previous, vars.variantId));
      }
      return { previous } satisfies MutationContext;
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(CART_QUERY_KEY, context?.previous);
      toast.error(err instanceof Error ? err.message : t("removeItemError"));
    },
    onSuccess: (result) => {
      if (result.cartDetails) {
        queryClient.setQueryData(CART_QUERY_KEY, result.cartDetails);
      }
    },
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  const t = useTranslations("store");

  return useMutation({
    mutationFn: () => clearCartAction(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<CartDetails | null>(CART_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(CART_QUERY_KEY, optimisticClear(previous));
      }
      return { previous } satisfies MutationContext;
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(CART_QUERY_KEY, context?.previous);
      toast.error(err instanceof Error ? err.message : t("clearCartError"));
    },
    onSuccess: () => {
      queryClient.setQueryData(CART_QUERY_KEY, null);
    },
  });
}
