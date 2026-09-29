import type { CartDetails } from "@/lib/services/cart";

// Must match DEFAULT_SHIPPING_PER_SELLER_MINOR in lib/services/cart.ts.
const SHIPPING_PER_SELLER_MINOR = 25000;

function recomputeTotals(cart: CartDetails): CartDetails {
  let totalItems = 0;
  let subtotalMinor = 0;
  let shippingMinor = 0;
  let hasUnavailableItems = false;

  const sellerGroups = cart.sellerGroups.map((group) => {
    const hasAvailable = group.items.some((i) => i.isAvailable);
    const groupSubtotal = group.items.reduce(
      (sum, i) => (i.isAvailable ? sum + i.subtotalMinor : sum),
      0
    );
    hasUnavailableItems = hasUnavailableItems || group.items.some((i) => !i.isAvailable);

    if (hasAvailable) {
      totalItems += group.items.reduce((sum, i) => (i.isAvailable ? sum + i.quantity : sum), 0);
      subtotalMinor += groupSubtotal;
      shippingMinor += SHIPPING_PER_SELLER_MINOR;
    }

    return {
      ...group,
      subtotalMinor: groupSubtotal,
      estimatedShippingMinor: hasAvailable ? SHIPPING_PER_SELLER_MINOR : 0,
    };
  });

  return {
    ...cart,
    sellerGroups,
    totalItems,
    subtotalMinor,
    shippingMinor,
    grandTotalMinor: subtotalMinor + shippingMinor,
    hasUnavailableItems,
  };
}

export interface OptimisticAddItem {
  productId: string;
  variantId: string;
  sellerId: string;
  sellerName: string;
  sellerSlug: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  image: string;
  priceMinor: number;
  compareAtMinor: number | null;
  quantity: number;
  stockAvailable: number;
}

/**
 * Best-effort client-side prediction of the cart after an add-to-cart call.
 * Used only to make the UI feel instant; the mutation's onSuccess replaces
 * this with the server's authoritative CartDetails the moment it resolves.
 */
export function optimisticAddToCart(
  cart: CartDetails | null | undefined,
  item: OptimisticAddItem
): CartDetails {
  const base: CartDetails = cart ?? {
    cartId: "optimistic",
    sellerGroups: [],
    totalItems: 0,
    subtotalMinor: 0,
    shippingMinor: 0,
    grandTotalMinor: 0,
    currency: "PKR",
    hasUnavailableItems: false,
  };

  const groups = base.sellerGroups.map((g) => ({ ...g, items: [...g.items] }));
  let group = groups.find((g) => g.sellerId === item.sellerId);
  if (!group) {
    group = {
      sellerId: item.sellerId,
      sellerName: item.sellerName,
      sellerSlug: item.sellerSlug,
      items: [],
      subtotalMinor: 0,
      estimatedShippingMinor: 0,
    };
    groups.push(group);
  }

  const existing = group.items.find((i) => i.variantId === item.variantId);
  if (existing) {
    existing.quantity += item.quantity;
    existing.subtotalMinor = existing.quantity * existing.priceMinor;
  } else {
    group.items.push({
      cartItemId: `optimistic-${item.variantId}`,
      variantId: item.variantId,
      productId: item.productId,
      productTitle: item.productTitle,
      productSlug: item.productSlug,
      sku: item.sku,
      attributes: {},
      priceMinor: item.priceMinor,
      compareAtMinor: item.compareAtMinor,
      image: item.image,
      quantity: item.quantity,
      stockAvailable: item.stockAvailable,
      isAvailable: true,
      subtotalMinor: item.priceMinor * item.quantity,
    });
  }

  return recomputeTotals({ ...base, sellerGroups: groups });
}

export function optimisticSetQuantity(
  cart: CartDetails,
  variantId: string,
  quantity: number
): CartDetails {
  const groups = cart.sellerGroups
    .map((g) => ({
      ...g,
      items: g.items
        .map((i) =>
          i.variantId === variantId ? { ...i, quantity, subtotalMinor: i.priceMinor * quantity } : i
        )
        .filter((i) => i.quantity > 0),
    }))
    .filter((g) => g.items.length > 0);

  return recomputeTotals({ ...cart, sellerGroups: groups });
}

export function optimisticRemove(cart: CartDetails, variantId: string): CartDetails {
  return optimisticSetQuantity(cart, variantId, 0);
}

export function optimisticClear(cart: CartDetails): CartDetails {
  return {
    ...cart,
    sellerGroups: [],
    totalItems: 0,
    subtotalMinor: 0,
    shippingMinor: 0,
    grandTotalMinor: 0,
    hasUnavailableItems: false,
  };
}
