import { apiConfig } from '@/config/api';
import { Customer, Service, Vehicle, OrderStatus } from '@/types';

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

interface LoginResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'employee' | 'customer';
}

const buildApiUrl = (path: string) => `${apiConfig.API_BASE_URL || ''}${path}`;

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildApiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Erro na API: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};

export const backendApi = {
  async findOpenOrderByPlate(plate: string): Promise<OpenOrderResponse | null> {
    try {
      return await request<OpenOrderResponse>(`/api/orders/open-by-plate/${plate}`);
    } catch (_error) {
      return null;
    }
  },

  login(identifier: string, password: string) {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  listServices() {
    return request<Service[]>('/api/services');
  },

  createService(service: Service) {
    return request<{ id: string }>('/api/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  },

  updateService(service: Service) {
    return request<{ ok: boolean }>(`/api/services/${service.id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
  },

  deleteService(id: string) {
    return request<void>(`/api/services/${id}`, { method: 'DELETE' });
  },
};
