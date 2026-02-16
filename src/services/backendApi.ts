import { apiConfig } from '@/config/api';
import { Customer, Vehicle, OrderStatus } from '@/types';

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

const buildApiUrl = (path: string) => {
  const base = apiConfig.API_BASE_URL || '';
  return `${base}${path}`;
};

export const backendApi = {
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
};
