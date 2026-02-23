import { apiConfig } from '@/config/api';
import {
  AuthUser,
  Customer,
  LoginPayload,
  OrderStatus,
  RegisterCustomerPayload,
  Service,
  ServiceProductConsumption,
  SizePricing,
  StockAlert,
  Product,
  Vehicle,
  VehicleType,
} from '@/types';


interface UserProfilePayload {
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  birthDate?: string;
  emergencyContact?: string;
  department?: string;
  jobTitle?: string;
}

interface PasswordUpdatePayload {
  currentPassword: string;
  newPassword: string;
}

interface OpenOrderResponse {
  found: boolean;
  openOrder: boolean;
  customer?: Customer;
  vehicle?: Vehicle;
  order?: {
    id: string;
    status: OrderStatus;
    total: number;
    date: string;
  } | null;
}

const emptyPricing: SizePricing = {
  costP: 0,
  costM: 0,
  costG: 0,
  priceP: 0,
  priceM: 0,
  priceG: 0,
};

const vehicleTypes: VehicleType[] = ['carro', 'moto', 'caminhao'];

const buildApiUrl = (path: string) => {
  const base = (apiConfig.API_BASE_URL || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!base) {
    return normalizedPath;
  }

  if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
};

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeService = (raw: Record<string, unknown>): Service => {
  const pricingFromApi = raw.pricing && typeof raw.pricing === 'object'
    ? (raw.pricing as Partial<Record<VehicleType, Partial<SizePricing>>>)
    : {};

  const rawVehicleTypes = Array.isArray(raw.vehicleTypes)
    ? raw.vehicleTypes
    : Array.isArray(raw.vehicle_types)
      ? raw.vehicle_types
      : vehicleTypes;

  const validVehicleTypes = rawVehicleTypes.filter((type): type is VehicleType =>
    vehicleTypes.includes(type as VehicleType),
  );

  const buildTypePricing = (type: VehicleType): SizePricing => ({
    costP: toNumber(pricingFromApi[type]?.costP),
    costM: toNumber(pricingFromApi[type]?.costM),
    costG: toNumber(pricingFromApi[type]?.costG),
    priceP: toNumber(pricingFromApi[type]?.priceP),
    priceM: toNumber(pricingFromApi[type]?.priceM),
    priceG: toNumber(pricingFromApi[type]?.priceG),
  });

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    name: String(raw.name ?? ''),
    hours: toNumber(raw.hours ?? 1),
    needsScheduling: Boolean(raw.needsScheduling ?? raw.needs_scheduling ?? false),
    products: String(raw.products ?? ''),
    observation: String(raw.observation ?? ''),
    priceRule: String(raw.priceRule ?? raw.price_rule ?? ''),
    perUnit: Boolean(raw.perUnit ?? raw.per_unit ?? false),
    vehicleTypes: validVehicleTypes.length > 0 ? validVehicleTypes : [...vehicleTypes],
    active: Boolean(raw.active ?? true),
    averageTimeMinutes: toNumber(raw.averageTimeMinutes ?? raw.average_time_minutes ?? 0),
    productConsumption: Array.isArray(raw.productConsumption)
      ? (raw.productConsumption as ServiceProductConsumption[])
      : Array.isArray(raw.product_consumption)
        ? (raw.product_consumption as ServiceProductConsumption[])
        : [],
    pricing: {
      carro: buildTypePricing('carro') || { ...emptyPricing },
      moto: buildTypePricing('moto') || { ...emptyPricing },
      caminhao: buildTypePricing('caminhao') || { ...emptyPricing },
    },
  };
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Falha na requisição (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const backendApi = {
  async listProducts(): Promise<Product[]> {
    return requestJson<Product[]>('/api/products');
  },

  async listLowStockAlerts(): Promise<StockAlert[]> {
    return requestJson<StockAlert[]>('/api/stock/alerts');
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    return requestJson<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async registerCustomer(payload: RegisterCustomerPayload): Promise<AuthUser> {
    return requestJson<AuthUser>('/api/auth/register-customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createUser(payload: UserProfilePayload & { role: 'admin' | 'employee' | 'customer'; password?: string }): Promise<AuthUser> {
    return requestJson<AuthUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getUserProfile(userId: string): Promise<AuthUser> {
    return requestJson<AuthUser>(`/api/users/${userId}/profile`);
  },

  async updateUserProfile(userId: string, payload: UserProfilePayload): Promise<AuthUser> {
    return requestJson<AuthUser>(`/api/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateUserPassword(userId: string, payload: PasswordUpdatePayload): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async listServices(): Promise<Service[]> {
    const rows = await requestJson<unknown[]>('/api/services');
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => normalizeService(row));
  },

  async createService(service: Omit<Service, 'id'> & { id?: string }): Promise<Service> {
    const created = await requestJson<Record<string, unknown>>('/api/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    return normalizeService(created);
  },

  async updateService(service: Service): Promise<Service> {
    const updated = await requestJson<Record<string, unknown>>(`/api/services/${service.id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
    return normalizeService(updated);
  },

  async deleteService(id: string): Promise<void> {
    await requestJson<unknown>(`/api/services/${id}`, {
      method: 'DELETE',
    });
  },

  async findOpenOrderByPlate(plate: string): Promise<OpenOrderResponse | null> {
    try {
      const response = await fetch(buildApiUrl(`/api/orders/open-by-plate/${plate}`));
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (_error) {
      return null;
    }
  },

  async completeWorkOrderItem(itemId: string): Promise<{ ok: boolean }> {
    return requestJson<{ ok: boolean }>(`/api/work-order-items/${itemId}/complete`, {
      method: 'POST',
    });
  },
};
