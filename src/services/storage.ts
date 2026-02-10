import { Service, Employee, OrderSummary } from '@/types';
import { initialServices } from '@/data/services';

const KEYS = {
  services: 'arycar_services',
  employees: 'arycar_employees',
  orders: 'arycar_orders',
};

export const storageService = {
  getServices(): Service[] {
    const data = localStorage.getItem(KEYS.services);
    if (!data) {
      localStorage.setItem(KEYS.services, JSON.stringify(initialServices));
      return initialServices;
    }
    return JSON.parse(data);
  },

  saveServices(services: Service[]) {
    localStorage.setItem(KEYS.services, JSON.stringify(services));
  },

  getEmployees(): Employee[] {
    const data = localStorage.getItem(KEYS.employees);
    return data ? JSON.parse(data) : [];
  },

  saveEmployees(employees: Employee[]) {
    localStorage.setItem(KEYS.employees, JSON.stringify(employees));
  },

  getOrders(): OrderSummary[] {
    const data = localStorage.getItem(KEYS.orders);
    return data ? JSON.parse(data) : [];
  },

  saveOrder(order: OrderSummary) {
    const orders = this.getOrders();
    orders.push(order);
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  },
};
