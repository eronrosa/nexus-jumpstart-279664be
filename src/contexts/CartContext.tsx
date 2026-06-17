import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  add: () => {},
  remove: () => {},
  increment: () => {},
  decrement: () => {},
  updateNotes: () => {},
  clear: () => {},
  total: 0,
  count: 0,
});

export const useCart = () => useContext(CartContext);

// Build a unique key so the same product with different notes counts as a separate line
const lineKey = (id: string, notes?: string) =>
  notes && notes.trim() ? `${id}::${notes.trim()}` : id;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (item: Omit<CartItem, "qty">, qty: number = 1) => {
    const key = lineKey(item.id, item.notes);
    setItems(prev => {
      const existing = prev.find(i => i.id === key);
      if (existing) return prev.map(i => i.id === key ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...item, id: key, qty }];
    });
  };

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const increment = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));

  const decrement = (id: string) =>
    setItems(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
      .filter(i => i.qty > 0)
    );

  const updateNotes = (id: string, notes: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, notes } : i));

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, increment, decrement, updateNotes, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
};
