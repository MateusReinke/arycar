export type VehicleSize = 'P' | 'M' | 'G';

export interface Service {
  id: string;
  name: string;
  costP: number;
  costM: number;
  costG: number;
  priceP: number;
  priceM: number;
  priceG: number;
  hours: number;
  needsScheduling: boolean;
  products: string;
  observation: string;
  priceRule: string;
  perUnit: boolean;
}

export interface CartItem {
  service: Service;
  quantity: number;
  size: VehicleSize;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface OrderSummary {
  id: string;
  items: CartItem[];
  size: VehicleSize;
  total: number;
  date: string;
}
