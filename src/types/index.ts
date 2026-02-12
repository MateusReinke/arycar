export type VehicleSize = 'P' | 'M' | 'G';
export type VehicleType = 'carro' | 'moto' | 'caminhao';

export const vehicleTypeLabels: Record<VehicleType, string> = {
  carro: 'Carro',
  moto: 'Moto',
  caminhao: 'Caminhão',
};

export const vehicleSizeLabels: Record<VehicleSize, { label: string; desc: string }> = {
  P: { label: 'Pequeno', desc: 'Compacto' },
  M: { label: 'Médio', desc: 'Intermediário' },
  G: { label: 'Grande', desc: 'Grande porte' },
};

export interface SizePricing {
  costP: number;
  costM: number;
  costG: number;
  priceP: number;
  priceM: number;
  priceG: number;
}

export interface Service {
  id: string;
  name: string;
  pricing: Record<VehicleType, SizePricing>;
  hours: number;
  needsScheduling: boolean;
  products: string;
  observation: string;
  priceRule: string;
  perUnit: boolean;
  vehicleTypes: VehicleType[];
}

export interface CartItem {
  service: Service;
  quantity: number;
  vehicleType: VehicleType;
  size: VehicleSize;
}

export interface Customer {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  address: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  size: VehicleSize;
  brand: string;
  model: string;
  color: string;
  year: string;
  km: string;
  customerId: string;
}

export interface AppSettings {
  whatsappNumber: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}

export interface OrderSummary {
  id: string;
  items: CartItem[];
  vehicleType: VehicleType;
  size: VehicleSize;
  total: number;
  date: string;
  customerId: string;
  customerName: string;
  vehiclePlate: string;
  pickupDelivery: boolean;
}
