import { create } from 'zustand';

export interface CartItem {
  id?: string; // unique cart item key
  food_id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  customizations?: string[];
  instructions?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string | number) => void;
  updateQuantity: (cartItemId: string | number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

const generateCartItemId = (item: CartItem) => {
  const custKey = item.customizations ? item.customizations.sort().join(',') : '';
  const instKey = item.instructions || '';
  return `${item.food_id}-${custKey}-${instKey}`;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    const itemKey = item.id || generateCartItemId(item);
    const itemWithKey = { ...item, id: itemKey };
    const existing = state.items.find(i => (i.id || generateCartItemId(i)) === itemKey);
    if (existing) {
      return {
        items: state.items.map(i => (i.id || generateCartItemId(i)) === itemKey ? { ...i, quantity: i.quantity + item.quantity } : i)
      };
    }
    return { items: [...state.items, itemWithKey] };
  }),
  removeItem: (cartItemId) => set((state) => ({
    items: state.items.filter(i => (i.id || i.food_id) !== cartItemId)
  })),
  updateQuantity: (cartItemId, quantity) => set((state) => ({
    items: state.items.map(i => (i.id || i.food_id) === cartItemId ? { ...i, quantity } : i)
  })),
  clearCart: () => set({ items: [] }),
  totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
  totalPrice: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
}));
