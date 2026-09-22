import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  categoryName?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (slugOrId: string) => void;
  toggleItem: (item: WishlistItem) => boolean; // returns true if added, false if removed
  isInWishlist: (slugOrId: string) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        if (!items.some((i) => i.slug === item.slug || i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },

      removeItem: (slugOrId) => {
        set({
          items: get().items.filter(
            (i) => i.slug !== slugOrId && i.id !== slugOrId
          ),
        });
      },

      toggleItem: (item) => {
        const { items, addItem, removeItem } = get();
        const exists = items.some((i) => i.slug === item.slug || i.id === item.id);
        if (exists) {
          removeItem(item.slug || item.id);
          return false;
        } else {
          addItem(item);
          return true;
        }
      },

      isInWishlist: (slugOrId) => {
        return get().items.some(
          (i) => i.slug === slugOrId || i.id === slugOrId
        );
      },

      clearWishlist: () => set({ items: [] }),

      getTotalItems: () => get().items.length,
    }),
    {
      name: 'veiled_canvas_wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
