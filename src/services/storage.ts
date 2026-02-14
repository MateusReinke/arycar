import { Service, Employee, OrderSummary, Customer, Vehicle, AppSettings } from '@/types';
import { initialServices } from '@/data/services';

const KEYS = {
  services: 'arycar_services',
  employees: 'arycar_employees',
  orders: 'arycar_orders',
  customers: 'arycar_customers',
  vehicles: 'arycar_vehicles',
  settings: 'arycar_settings',
};

export const storageService = {
  // Services
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

  // Employees
  getEmployees(): Employee[] {
    const data = localStorage.getItem(KEYS.employees);
    return data ? JSON.parse(data) : [];
  },
  saveEmployees(employees: Employee[]) {
    localStorage.setItem(KEYS.employees, JSON.stringify(employees));
  },

  // Orders
  getOrders(): OrderSummary[] {
    const data = localStorage.getItem(KEYS.orders);
    return data ? JSON.parse(data) : [];
  },
  saveOrder(order: OrderSummary) {
    const orders = this.getOrders();
    orders.push(order);
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  },
  updateOrder(order: OrderSummary) {
    const orders = this.getOrders().map(o => o.id === order.id ? order : o);
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  },
  deleteOrder(id: string) {
    const orders = this.getOrders().filter(o => o.id !== id);
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  },

  // Customers
  getCustomers(): Customer[] {
    const data = localStorage.getItem(KEYS.customers);
    return data ? JSON.parse(data) : [];
  },
  saveCustomers(customers: Customer[]) {
    localStorage.setItem(KEYS.customers, JSON.stringify(customers));
  },
  addCustomer(customer: Customer) {
    const customers = this.getCustomers();
    customers.push(customer);
    this.saveCustomers(customers);
  },
  updateCustomer(customer: Customer) {
    const customers = this.getCustomers().map(c => c.id === customer.id ? customer : c);
    this.saveCustomers(customers);
  },
  findCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  },
  findCustomerByCpf(cpf: string): Customer | undefined {
    return this.getCustomers().find(c => c.cpf === cpf);
  },

  // Vehicles
  getVehicles(): Vehicle[] {
    const data = localStorage.getItem(KEYS.vehicles);
    return data ? JSON.parse(data) : [];
  },
  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(KEYS.vehicles, JSON.stringify(vehicles));
  },
  addVehicle(vehicle: Vehicle) {
    const vehicles = this.getVehicles();
    vehicles.push(vehicle);
    this.saveVehicles(vehicles);
  },
  findVehicleByPlate(plate: string): Vehicle | undefined {
    return this.getVehicles().find(v => v.plate.toUpperCase() === plate.toUpperCase());
  },
  getVehiclesByCustomer(customerId: string): Vehicle[] {
    return this.getVehicles().filter(v => v.customerId === customerId);
  },

  // Settings
  getSettings(): AppSettings {
    const data = localStorage.getItem(KEYS.settings);
    return data ? JSON.parse(data) : { whatsappNumber: '' };
  },
  saveSettings(settings: AppSettings) {
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  },
};
