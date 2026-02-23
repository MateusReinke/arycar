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

const normalizeProduct = (raw: Record<string, unknown>): Product => ({
  id: String(raw.id ?? crypto.randomUUID()),
  productType: String(raw.productType ?? raw.product_type ?? 'Insumo'),
  brand: String(raw.brand ?? 'Genérica'),
  name: String(raw.name ?? ''),
  unit: String(raw.unit ?? 'l') as Product['unit'],
  stockCurrent: toNumber(raw.stockCurrent ?? raw.stock_current),
  stockMin: toNumber(raw.stockMin ?? raw.stock_min),
  pricePerLiter: toNumber(raw.pricePerLiter ?? raw.price_per_liter),
  active: Boolean(raw.active ?? true),
});

const parseVehicleTypes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed.slice(1, -1)
        .split(',')
        .map((part) => part.replace(/"/g, '').trim().toLowerCase())
        .filter(Boolean);
    }

    if (trimmed) {
      return trimmed.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    }
  }

  return [];
};

const normalizeService = (raw: Record<string, unknown>): Service => {
  const pricingFromApi = raw.pricing && typeof raw.pricing === 'object'
    ? (raw.pricing as Record<string, Partial<SizePricing>>)
    : {};

  const parsedVehicleTypes = parseVehicleTypes(raw.vehicleTypes ?? raw.vehicle_types);
  const normalizedVehicleTypes = Array.from(new Set(parsedVehicleTypes));
  const fallbackVehicleTypes = normalizedVehicleTypes.length > 0 ? normalizedVehicleTypes : [...vehicleTypes];

  const normalizedPricing = fallbackVehicleTypes.reduce<Record<string, SizePricing>>((acc, type) => {
    const source = pricingFromApi[type] || {};
    acc[type] = {
      costP: toNumber(source.costP),
      costM: toNumber(source.costM),
      costG: toNumber(source.costG),
      priceP: toNumber(source.priceP),
      priceM: toNumber(source.priceM),
      priceG: toNumber(source.priceG),
    };
    return acc;
  }, {
    carro: { ...emptyPricing },
    moto: { ...emptyPricing },
    caminhao: { ...emptyPricing },
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
    vehicleTypes: fallbackVehicleTypes,
    active: Boolean(raw.active ?? true),
    averageTimeMinutes: toNumber(raw.averageTimeMinutes ?? raw.average_time_minutes ?? 0),
    productConsumption: Array.isArray(raw.productConsumption)
      ? (raw.productConsumption as ServiceProductConsumption[])
      : Array.isArray(raw.product_consumption)
        ? (raw.product_consumption as ServiceProductConsumption[])
        : [],
    pricing: normalizedPricing,
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
    const rows = await requestJson<unknown[]>('/api/products');
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => normalizeProduct(row));
  },

  async createProduct(payload: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    const created = await requestJson<Record<string, unknown>>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeProduct(created);
  },

  async updateProduct(product: Product): Promise<Product> {
    const updated = await requestJson<Record<string, unknown>>(`/api/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return normalizeProduct(updated);
  },

  async deleteProduct(id: string): Promise<void> {
    await requestJson<unknown>(`/api/products/${id}`, {
      method: 'DELETE',
    });
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
