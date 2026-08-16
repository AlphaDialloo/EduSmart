import { createContext, useCallback, useContext, useMemo, useState } from "react";
const CartContext = createContext(null);
const STORAGE_KEY = "edusmart_cart";
function readStoredCart() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (!savedCart) {
      return [];
    }
    const parsedCart = JSON.parse(savedCart);
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Erreur de lecture du panier :", error);
    return [];
  }
}
export function CartProvider({
  children
}) {
  const [items, setItems] = useState(readStoredCart);
  const saveItems = useCallback(nextItems => {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  }, []);
  const addToCart = useCallback(item => {
    if (!item?.courseId || !item?.accessPlanId) {
      throw new Error("Le cours et le plan d’accès sont obligatoires.");
    }
    const nextItems = [...items.filter(currentItem => currentItem.courseId !== item.courseId), {
      ...item,
      cartItemId: `${item.courseId}-${item.accessPlanId}`,
      addedAt: new Date().toISOString()
    }];
    saveItems(nextItems);
  }, [items, saveItems]);
  const removeFromCart = useCallback(courseId => {
    saveItems(items.filter(item => item.courseId !== courseId));
  }, [items, saveItems]);
  const clearCart = useCallback(() => {
    saveItems([]);
  }, [saveItems]);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.price || 0), 0), [items]);
  const value = useMemo(() => ({
    items,
    itemCount: items.length,
    total,
    addToCart,
    removeFromCart,
    clearCart
  }), [items, total, addToCart, removeFromCart, clearCart]);
  return <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart doit être utilisé dans CartProvider.");
  }
  return context;
}
