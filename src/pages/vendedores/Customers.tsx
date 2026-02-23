import { useMemo, useState } from 'react';
import { Car, Mail, MapPin, Phone, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { storageService } from '@/services/storage';
import { Customer, getOrderStatusLabel, getStatusColorClass, OrderSummary, Vehicle, vehicleTypeLabels } from '@/types';

const formatPhone = (phone?: string) => {
  if (!phone) return '-';
  const nums = phone.replace(/\D/g, '');
  if (nums.length <= 2) return nums;
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
};

const OrderHistory = ({ orders }: { orders: OrderSummary[] }) => {
  const settings = storageService.getSettings();

  if (!orders.length) {
    return <p className="text-sm text-muted-foreground">Sem histórico de ordens de serviço.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">OS #{order.id}</p>
            <Badge variant="outline" className={`border ${getStatusColorClass(order.status, settings.customStatuses)}`}>
              {getOrderStatusLabel(order.status, settings.customStatuses)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Data: {order.date}</p>
          <p className="text-xs text-muted-foreground">Placa: {order.vehiclePlate}</p>
          <p className="mt-2 text-xs font-medium">Serviços:</p>
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.service.id}`}>• {item.service.name} (x{item.quantity})</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const Customers = () => {
  const customers = storageService.getCustomers();
  const vehicles = storageService.getVehicles();
  const orders = storageService.getOrders();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const customerVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.customerId === selectedCustomerId),
    [selectedCustomerId, vehicles],
  );

  const customerOrders = useMemo(
    () => orders
      .filter((order) => order.customerId === selectedCustomerId)
      .sort((a, b) => Number(b.id) - Number(a.id)),
    [orders, selectedCustomerId],
  );

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Clique em um cliente para ver dados, veículos e histórico de ordens de serviço.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lista de clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[65vh] pr-3">
              <div className="space-y-3">
                {!customers.length && <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}
                {customers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedCustomerId === customer.id ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                  >
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedCustomer && <p className="text-sm text-muted-foreground">Selecione um cliente para visualizar os detalhes.</p>}

            {selectedCustomer && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-sm"><UserRound className="h-4 w-4" />{selectedCustomer.name}</p>
                  <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4" />{formatPhone(selectedCustomer.phone)}</p>
                  <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4" />{selectedCustomer.email || 'Sem e-mail'}</p>
                  <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" />{selectedCustomer.address || 'Sem endereço'}</p>
                </div>

                <div>
                  <h2 className="mb-3 text-lg font-semibold">Veículos do cliente</h2>
                  {!customerVehicles.length && <p className="text-sm text-muted-foreground">Cliente sem veículos cadastrados.</p>}
                  <div className="grid gap-3 md:grid-cols-2">
                    {customerVehicles.map((vehicle: Vehicle) => (
                      <div key={vehicle.id} className="rounded-xl border p-3 text-sm">
                        <p className="font-semibold">{vehicle.plate}</p>
                        <p className="text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-muted-foreground">{vehicleTypeLabels[vehicle.type]} • {vehicle.year} • {vehicle.color}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-lg font-semibold">Histórico de ordens de serviço</h2>
                  <OrderHistory orders={customerOrders} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Customers;
