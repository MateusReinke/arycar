import React, { createContext, useContext, useState, useCallback } from 'react';
import { Service, Employee, CartItem, VehicleSize, VehicleType, OrderSummary, Customer, Vehicle } from '@/types';
import { storageService } from '@/services/storage';

export type FlowStep = 'plate' | 'register' | 'services';

interface AppContextType {
  // Data
  services: Service[];
  setServices: (s: Service[]) => void;
  employees: Employee[];
  setEmployees: (e: Employee[]) => void;

  // Flow
  step: FlowStep;
  setStep: (s: FlowStep) => void;
  currentCustomer: Customer | null;
  setCurrentCustomer: (c: Customer | null) => void;
  currentVehicle: Vehicle | null;
  setCurrentVehicle: (v: Vehicle | null) => void;
  pendingPlate: string;
  setPendingPlate: (p: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (service: Service) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartQuantity: (serviceId: string, qty: number) => void;
  clearCart: () => void;
  pickupDelivery: boolean;
  setPickupDelivery: (v: boolean) => void;

  // Helpers
  getPrice: (service: Service, vType: VehicleType, size: VehicleSize) => number;
  getCost: (service: Service, vType: VehicleType, size: VehicleSize) => number;
  cartTotal: number;
  finalizeOrder: () => OrderSummary | null;
  resetFlow: () => void;

  // Filtered services
  availableServices: Service[];
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
  const [step, setStep] = useState<FlowStep>('plate');
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [pendingPlate, setPendingPlate] = useState('');
  const [pickupDelivery, setPickupDelivery] = useState(false);

  const setServices = useCallback((s: Service[]) => {
    setServicesState(s);
    storageService.saveServices(s);
  }, []);

  const setEmployees = useCallback((e: Employee[]) => {
    setEmployeesState(e);
    storageService.saveEmployees(e);
  }, []);

  const getPrice = (service: Service, vType: VehicleType, size: VehicleSize) => {
    const p = service.pricing[vType];
    return size === 'P' ? p.priceP : size === 'M' ? p.priceM : p.priceG;
  };

  const getCost = (service: Service, vType: VehicleType, size: VehicleSize) => {
    const p = service.pricing[vType];
    return size === 'P' ? p.costP : size === 'M' ? p.costM : p.costG;
  };

  const availableServices = currentVehicle
    ? services.filter(s => s.vehicleTypes.includes(currentVehicle.type))
    : [];

  const addToCart = useCallback((service: Service) => {
    if (!currentVehicle) return;
    setCart(prev => {
      const existing = prev.find(i => i.service.id === service.id);
      if (existing) {
        if (service.perUnit) {
          return prev.map(i => i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return prev;
      }
      return [...prev, { service, quantity: 1, vehicleType: currentVehicle.type, size: currentVehicle.size }];
    });
  }, [currentVehicle]);

  const removeFromCart = useCallback((serviceId: string) => {
    setCart(prev => prev.filter(i => i.service.id !== serviceId));
  }, []);

  const updateCartQuantity = useCallback((serviceId: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i => i.service.id === serviceId ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, item) => {
    const price = getPrice(item.service, item.vehicleType, item.size);
    return sum + price * item.quantity;
  }, 0);

  const finalizeOrder = useCallback((): OrderSummary | null => {
    if (!currentCustomer || !currentVehicle || cart.length === 0) return null;
    const order: OrderSummary = {
      id: Date.now().toString(),
      items: [...cart],
      vehicleType: currentVehicle.type,
      size: currentVehicle.size,
      total: cartTotal,
      date: new Date().toLocaleString('pt-BR'),
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      vehiclePlate: currentVehicle.plate,
      pickupDelivery,
    };
    storageService.saveOrder(order);
    setCart([]);
    return order;
  }, [cart, currentCustomer, currentVehicle, cartTotal, pickupDelivery]);

  const resetFlow = useCallback(() => {
    setStep('plate');
    setCurrentCustomer(null);
    setCurrentVehicle(null);
    setCart([]);
    setPickupDelivery(false);
    setPendingPlate('');
  }, []);

  return (
    <AppContext.Provider value={{
      services, setServices, employees, setEmployees,
      step, setStep, currentCustomer, setCurrentCustomer, currentVehicle, setCurrentVehicle,
      pendingPlate, setPendingPlate,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
      pickupDelivery, setPickupDelivery,
      getPrice, getCost, cartTotal, finalizeOrder, resetFlow,
      availableServices,
    }}>
      {children}
    </AppContext.Provider>
  );
};
