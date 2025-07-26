
'use client';

import * as React from 'react';
import type { CartItem, Generator } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Generator, quantity: number, usageHours: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number, usageHours: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    const savedCart = localStorage.getItem('amg-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('amg-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Generator, quantity: number, usageHours: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id);
      if (existingItem) {
        toast({
          title: 'Item Updated',
          description: `${item.name} quantity and usage hours have been updated in your cart.`,
        });
        return prevItems.map(i =>
          i.id === item.id ? { ...i, quantity, usageHours } : i
        );
      } else {
        toast({
          title: 'Item Added',
          description: `${item.name} has been added to your cart.`,
        });
        return [...prevItems, { ...item, quantity, usageHours }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast({
      title: 'Item Removed',
      description: 'The item has been removed from your cart.',
      variant: 'destructive'
    });
  };

  const updateCartItem = (itemId: string, quantity: number, usageHours: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity, usageHours } : item
      )
    );
  };
  
  const clearCart = () => {
      setCartItems([]);
      localStorage.removeItem('amg-cart');
  }

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateCartItem, clearCart, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
