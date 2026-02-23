import { useMemo, useState } from 'react';
import { CarFront, Gauge, Palette, UserRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { storageService } from '@/services/storage';
import { getOrderStatusLabel, getStatusColorClass, OrderSummary, vehicleSizeLabels, vehicleTypeLabels } from '@/types';

const OrderHistory = ({ orders }: { orders: OrderSummary[] }) => {
  const settings = storageService.getSettings();

  if (!orders.length) {
    return <p className="text-sm text-muted-foreground">Sem histórico de ordens de serviço para este veículo.</p>;
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
          <p className="text-xs text-muted-foreground">Cliente: {order.customerName}</p>
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

const Vehicles = () => {
  const customers = storageService.getCustomers();
  const vehicles = storageService.getVehicles();
  const orders = storageService.getOrders();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [selectedVehicleId, vehicles],
  );

  const vehicleCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedVehicle?.customerId) || null,
    [customers, selectedVehicle],
  );

  const vehicleOrders = useMemo(
    () => orders
      .filter((order) => order.vehiclePlate === selectedVehicle?.plate)
      .sort((a, b) => Number(b.id) - Number(a.id)),
    [orders, selectedVehicle],
  );

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Veículos</h1>
        <p className="text-muted-foreground">Clique em um veículo para ver detalhes do carro, do cliente e histórico de ordens de serviço.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lista de veículos</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[65vh] pr-3">
              <div className="space-y-3">
                {!vehicles.length && <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>}
                {vehicles.map((vehicle) => (
                  <button
                    type="button"
                    key={vehicle.id}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${selectedVehicleId === vehicle.id ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                  >
                    <p className="font-semibold">{vehicle.plate}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes do veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedVehicle && <p className="text-sm text-muted-foreground">Selecione um veículo para visualizar os detalhes.</p>}

            {selectedVehicle && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-sm"><CarFront className="h-4 w-4" />{selectedVehicle.brand} {selectedVehicle.model}</p>
                  <p className="text-sm font-semibold">Placa: {selectedVehicle.plate}</p>
                  <p className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4" />KM: {selectedVehicle.km || '-'}</p>
                  <p className="flex items-center gap-2 text-sm"><Palette className="h-4 w-4" />{selectedVehicle.color || '-'}</p>
                  <p className="text-sm">Tipo: {vehicleTypeLabels[selectedVehicle.type]}</p>
                  <p className="text-sm">Porte: {vehicleSizeLabels[selectedVehicle.size].label}</p>
                </div>

                <div className="rounded-xl border p-4">
                  <h2 className="mb-2 text-lg font-semibold">Cliente vinculado</h2>
                  {!vehicleCustomer && <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>}
                  {vehicleCustomer && (
                    <>
                      <p className="flex items-center gap-2 text-sm"><UserRound className="h-4 w-4" />{vehicleCustomer.name}</p>
                      <p className="text-sm text-muted-foreground">Telefone: {vehicleCustomer.phone}</p>
                      <p className="text-sm text-muted-foreground">E-mail: {vehicleCustomer.email || 'Sem e-mail'}</p>
                    </>
                  )}
                </div>

                <div>
                  <h2 className="mb-3 text-lg font-semibold">Histórico de ordens de serviço</h2>
                  <OrderHistory orders={vehicleOrders} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Vehicles;
