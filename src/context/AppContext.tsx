import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Service, Employee, CartItem, VehicleSize, OrderSummary } from '@/types';
import { storageService } from '@/services/storage';

interface AppContextType {
  services: Service[];
  setServices: (s: Service[]) => void;
  employees: Employee[];
  setEmployees: (e: Employee[]) => void;
  cart: CartItem[];
  addToCart: (service: Service, size: VehicleSize) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, qty: number) => void;
  clearCart: () => void;
  selectedSize: VehicleSize | null;
  setSelectedSize: (s: VehicleSize | null) => void;
  getPrice: (service: Service, size: VehicleSize) => number;
  getCost: (service: Service, size: VehicleSize) => number;
  cartTotal: number;
  finalizeOrder: () => OrderSummary | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServicesState] = useState<Service[]>(() => storageService.getServices());
  const [employees, setEmployeesState] = useState<Employee[]>(() => storageService.getEmployees());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSize, setSelectedSize] = useState<VehicleSize | null>(null);

  const setServices = useCallback((s: Service[]) => {
    setServicesState(s);
    storageService.saveServices(s);
  }, []);

  const setEmployees = useCallback((e: Employee[]) => {
    setEmployeesState(e);
    storageService.saveEmployees(e);
  }, []);

  const getPrice = (service: Service, size: VehicleSize) => {
    return size === 'P' ? service.priceP : size === 'M' ? service.priceM : service.priceG;
  };

  const getCost = (service: Service, size: VehicleSize) => {
    return size === 'P' ? service.costP : size === 'M' ? service.costM : service.costG;
  };

  const addToCart = useCallback((service: Service, size: VehicleSize) => {
    setCart(prev => {
      const existing = prev.find(i => i.service.id === service.id);
      if (existing) {
        if (service.perUnit) {
          return prev.map(i => i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return prev;
      }
      return [...prev, { service, quantity: 1, size }];
    });
  }, []);

  const removeFromCart = useCallback((serviceId: string) => {
    setCart(prev => prev.filter(i => i.service.id !== serviceId));
  }, []);

  const updateCartQuantity = useCallback((serviceId: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i => i.service.id === serviceId ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => {
    const price = getPrice(item.service, item.size);
    return sum + price * item.quantity;
  }, 0);

  const finalizeOrder = useCallback((): OrderSummary | null => {
    if (!selectedSize || cart.length === 0) return null;
    const order: OrderSummary = {
      id: Date.now().toString(),
      items: [...cart],
      size: selectedSize,
      total: cartTotal,
      date: new Date().toLocaleString('pt-BR'),
    };
    storageService.saveOrder(order);
    setCart([]);
    return order;
  }, [cart, selectedSize, cartTotal]);

  return (
    <AppContext.Provider value={{
      services, setServices, employees, setEmployees,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      selectedSize, setSelectedSize, getPrice, getCost, cartTotal, finalizeOrder,
    }}>
      {children}
    </AppContext.Provider>
  );
};
