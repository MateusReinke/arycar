export type VehicleSize = 'P' | 'M' | 'G';
export type VehicleType = 'carro' | 'moto' | 'caminhao';
export type UnitType = 'ml' | 'l' | 'g' | 'kg' | 'un';

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
  pricing: Record<string, SizePricing>;
  hours: number;
  needsScheduling: boolean;
  products: string;
  observation: string;
  priceRule: string;
  perUnit: boolean;
  vehicleTypes: string[];
  active?: boolean;
  averageTimeMinutes?: number;
  productConsumption?: ServiceProductConsumption[];
}

export interface Product {
  id: string;
  productType: string;
  brand: string;
  name: string;
  unit: UnitType;
  stockCurrent: number;
  stockMin: number;
  pricePerLiter: number;
  active: boolean;
  usedInServices?: number;
}

export type StockMovementType = 'manual_in' | 'manual_out' | 'service_consumption' | string;

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  movementType: StockMovementType;
  qty: number;
  unit: UnitType;
  stockBefore: number;
  stockAfter: number;
  details?: { reason?: string | null } & Record<string, unknown>;
  createdAt: string;
}

export interface ServiceProductConsumption {
  id?: string;
  productId: string;
  quantity: number;
  unit: UnitType;
  wasteFactor: number;
  productName?: string;
  productUnit?: UnitType;
}

export interface StockAlert {
  productId: string;
  productName: string;
  stockCurrent: number;
  stockMin: number;
  unit: UnitType;
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
  email?: string;
  emergencyContact?: string;
  notes?: string;
  userType?: 'cliente' | 'empresa';
  username?: string;
  role?: UserRole;
  forcePasswordChange?: boolean;
  whatsappNotifications?: boolean;
  addresses?: Array<{
    id: string;
    label: string;
    cep: string;
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    complement?: string;
  }>;
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

export type UserRole = 'admin' | 'employee' | 'customer';

export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  cpf?: string;
  address?: string;
  birthDate?: string;
  emergencyContact?: string;
  department?: string;
  jobTitle?: string;
  token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterCustomerPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  serviceRequest: string;
}

export type BaseOrderStatus = 'waiting' | 'in_progress' | 'done' | 'delivered';
export type OrderStatus = BaseOrderStatus | string;

export interface CustomStatus {
  key: string;
  label: string;
  colorClass: string;
}

export const defaultOrderStatusLabels: Record<BaseOrderStatus, string> = {
  waiting: 'Aguardando',
  in_progress: 'Em Andamento',
  done: 'Finalizado',
  delivered: 'Entregue',
};

export const defaultStatusColors: Record<BaseOrderStatus, string> = {
  waiting: 'bg-yellow-500/10 border-yellow-500/40',
  in_progress: 'bg-blue-500/10 border-blue-500/40',
  done: 'bg-green-500/10 border-green-500/40',
  delivered: 'bg-muted border-border',
};

export interface AppSettings {
  whatsappNumber: string;
  customStatuses: CustomStatus[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  department?: string;
  shift?: string;
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
  status: OrderStatus;
  description?: string;
}

export const getOrderStatusLabel = (status: OrderStatus, customStatuses: CustomStatus[] = []) => {
  const defaultLabel = defaultOrderStatusLabels[status as BaseOrderStatus];
  if (defaultLabel) return defaultLabel;
  const custom = customStatuses.find((item) => item.key === status);
  return custom?.label || status;
};

export const getStatusColorClass = (status: OrderStatus, customStatuses: CustomStatus[] = []) => {
  const defaultColor = defaultStatusColors[status as BaseOrderStatus];
  if (defaultColor) return defaultColor;
  const custom = customStatuses.find((item) => item.key === status);
  return custom?.colorClass || 'bg-card border-border';
};
