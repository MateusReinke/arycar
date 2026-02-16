import { useMemo, useState } from 'react';
import { storageService } from '@/services/storage';
import { useAuth } from '@/context/AuthContext';
import { getOrderStatusLabel, getStatusColorClass, vehicleTypeLabels, vehicleSizeLabels } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const CustomerPortal = () => {
  const { user } = useAuth();
  const settings = storageService.getSettings();
  const [orders, setOrders] = useState(() => storageService.getOrdersByCustomerPhone(user?.phone || ''));
  const customer = useMemo(() => {
    const phone = (user?.phone || '').replace(/\D/g, '');
    return storageService.getCustomers().find((item) => item.phone === phone);
  }, [user]);

  const vehicles = useMemo(
    () => customer ? storageService.getVehiclesByCustomer(customer.id) : [],
    [customer],
  );

  const [vehicleId, setVehicleId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [pickupDelivery, setPickupDelivery] = useState(false);

  const refresh = () => setOrders(storageService.getOrdersByCustomerPhone(user?.phone || ''));

  const handleRequest = () => {
    if (!customer) {
      toast.error('Cliente não encontrado para este telefone.');
      return;
    }

    if (!vehicleId) {
      toast.error('Selecione um veículo para solicitar o serviço.');
      return;
    }

    if (!serviceName.trim()) {
      toast.error('Informe o serviço desejado.');
      return;
    }

    if (pickupDelivery && !customer.address) {
      toast.error('Para solicitar busca em casa, é necessário ter endereço cadastrado.');
      return;
    }

    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    const order = {
      id: Date.now().toString(),
      items: [],
      vehicleType: vehicle.type,
      size: vehicle.size,
      total: 0,
      date: new Date().toLocaleString('pt-BR'),
      customerId: customer.id,
      customerName: customer.name,
      vehiclePlate: vehicle.plate,
      pickupDelivery,
      status: 'waiting',
      description: serviceName.trim(),
    };

    storageService.saveOrder(order);
    toast.success('Solicitação enviada com sucesso!');
    setServiceName('');
    setPickupDelivery(false);
    refresh();
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Área do Cliente</h1>

      {!customer && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Não encontramos cadastro com este telefone. Peça ao atendimento para atualizar seus dados.
            </p>
          </CardContent>
        </Card>
      )}

      {customer && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitar novo serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Veículo</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço solicitado</Label>
                <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Ex.: Polimento técnico" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={pickupDelivery} onCheckedChange={setPickupDelivery} id="pickup-request" />
              <Label htmlFor="pickup-request">Solicitar busca em casa (Leva e Traz)</Label>
            </div>
            {pickupDelivery && !customer.address && (
              <p className="text-xs text-destructive">Cadastre um endereço para habilitar a busca em casa.</p>
            )}

            <Button onClick={handleRequest}>Enviar solicitação</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Minhas Ordens</h2>
        {orders.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma OS encontrada.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {orders.slice().reverse().map((order) => (
            <Card key={order.id} className={getStatusColorClass(order.status, settings.customStatuses)}>
              <CardContent className="pt-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">OS #{order.id.slice(-4)}</p>
                  <Badge variant="outline">{getOrderStatusLabel(order.status, settings.customStatuses)}</Badge>
                </div>
                <p>{order.vehiclePlate} • {vehicleTypeLabels[order.vehicleType]} {vehicleSizeLabels[order.size].label}</p>
                <p className="text-muted-foreground">Abertura: {order.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
