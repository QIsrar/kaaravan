'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  colorName: string;
  colorHex: string;
  sku: string;
  /** Unit price in cents (base_price + additional_price) */
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  /** Total price in cents */
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.variantId === newItem.variantId
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.variantId === newItem.variantId
                  ? {
                      ...item,
                      quantity: Math.min(
                        item.quantity + newItem.quantity,
                        item.maxQuantity
                      ),
                    }
                  : item
              ),
            };
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.unitPrice * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'veiled-canvas-cart',
    }
  )
);
