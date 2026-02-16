import { useMemo, useState } from 'react';
import { storageService } from '@/services/storage';
import { useAuth } from '@/context/AuthContext';
import { getOrderStatusLabel, getStatusColorClass, vehicleTypeLabels, vehicleSizeLabels, Vehicle, VehicleSize, VehicleType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const emptyVehicleForm = {
  id: '',
  plate: '',
  type: 'carro' as VehicleType,
  size: 'M' as VehicleSize,
  brand: '',
  model: '',
  color: '',
  year: '',
  km: '',
};

const CustomerPortal = () => {
  const { user } = useAuth();
  const settings = storageService.getSettings();

  const customer = useMemo(() => {
    const phone = (user?.phone || '').replace(/\D/g, '');
    return storageService.getCustomers().find((item) => item.phone === phone);
  }, [user]);

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [pickupDelivery, setPickupDelivery] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const refreshVehicles = () => {
    if (!customer) return [] as Vehicle[];
    return storageService.getVehiclesByCustomer(customer.id);
  };

  const [vehicles, setVehicles] = useState<Vehicle[]>(refreshVehicles);
  const [orders, setOrders] = useState(() => storageService.getOrdersByCustomerPhone(user?.phone || ''));

  const services = storageService.getServices();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  const availableServices = selectedVehicle
    ? services.filter((service) => service.vehicleTypes.includes(selectedVehicle.type))
    : [];

  const openOrders = useMemo(
    () => orders.filter((order) => order.status === 'waiting' || order.status === 'in_progress')
      .sort((a, b) => b.id.localeCompare(a.id)),
    [orders],
  );

  const closedOrdersByDate = useMemo(() => {
    const closed = orders.filter((order) => order.status !== 'waiting' && order.status !== 'in_progress');
    const grouped = closed.reduce<Record<string, typeof closed>>((acc, order) => {
      const dateKey = order.date.split(',')[0] || order.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(order);
      return acc;
    }, {});

    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [orders]);

  const refresh = () => {
    setOrders(storageService.getOrdersByCustomerPhone(user?.phone || ''));
    setVehicles(refreshVehicles());
  };

  const handleRequest = () => {
    if (!customer) {
      toast.error('Cliente não encontrado para este telefone.');
      return;
    }
    if (!selectedVehicle) {
      toast.error('Selecione um veículo para solicitar o serviço.');
      return;
    }
    if (!selectedServiceId) {
      toast.error('Selecione um serviço disponível para este veículo.');
      return;
    }
    if (pickupDelivery && !customer.address) {
      toast.error('Para solicitar busca em casa, é necessário ter endereço cadastrado.');
      return;
    }

    const openOrder = storageService.findOpenOrderByPlate(selectedVehicle.plate);
    if (openOrder) {
      toast.error(`Já existe OS em aberto para ${selectedVehicle.plate}. Edite a ordem atual.`);
      return;
    }

    const service = services.find((item) => item.id === selectedServiceId);
    if (!service) return;

    const price = selectedVehicle.size === 'P' ? service.pricing[selectedVehicle.type].priceP
      : selectedVehicle.size === 'M' ? service.pricing[selectedVehicle.type].priceM
      : service.pricing[selectedVehicle.type].priceG;

    const order = {
      id: Date.now().toString(),
      items: [{ service, quantity: 1, vehicleType: selectedVehicle.type, size: selectedVehicle.size }],
      vehicleType: selectedVehicle.type,
      size: selectedVehicle.size,
      total: price,
      date: new Date().toLocaleString('pt-BR'),
      customerId: customer.id,
      customerName: customer.name,
      vehiclePlate: selectedVehicle.plate,
      pickupDelivery,
      status: 'waiting',
      description: `Solicitação pelo cliente: ${service.name}`,
    };

    storageService.saveOrder(order);
    toast.success('Solicitação enviada com sucesso!');
    setSelectedServiceId('');
    setPickupDelivery(false);
    refresh();
  };

  const startEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      id: vehicle.id,
      plate: vehicle.plate,
      type: vehicle.type,
      size: vehicle.size,
      brand: vehicle.brand,
      model: vehicle.model,
      color: vehicle.color,
      year: vehicle.year,
      km: vehicle.km,
    });
  };

  const saveVehicle = () => {
    if (!customer) return;
    if (!vehicleForm.plate.trim()) {
      toast.error('Placa é obrigatória.');
      return;
    }

    const normalizedPlate = vehicleForm.plate.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

    if (editingVehicleId) {
      const updated = storageService.getVehicles().map((vehicle) =>
        vehicle.id === editingVehicleId
          ? {
              ...vehicle,
              ...vehicleForm,
              plate: normalizedPlate,
              customerId: customer.id,
            }
          : vehicle,
      );
      storageService.saveVehicles(updated);
      toast.success('Veículo atualizado.');
    } else {
      storageService.addVehicle({
        id: Date.now().toString(),
        customerId: customer.id,
        ...vehicleForm,
        plate: normalizedPlate,
      });
      toast.success('Veículo cadastrado.');
    }

    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
    refresh();
  };

  const deleteVehicle = (vehicle: Vehicle) => {
    if (storageService.hasOpenOrderByVehicle(vehicle.plate)) {
      toast.error('Não é possível excluir veículo com OS aberta.');
      return;
    }

    const remaining = storageService.getVehicles().filter((item) => item.id !== vehicle.id);
    storageService.saveVehicles(remaining);
    toast.success('Veículo removido.');
    if (selectedVehicleId === vehicle.id) {
      setSelectedVehicleId('');
      setSelectedServiceId('');
    }
    refresh();
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Área do Cliente</h1>

      {!customer && (
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Cadastro não encontrado para este telefone.</p></CardContent></Card>
      )}

      {customer && (
        <>
          <Card>
            <CardHeader><CardTitle>Meus veículos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="border">
                    <CardContent className="pt-4 space-y-2">
                      <p className="font-semibold">{vehicle.plate}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model} • {vehicleTypeLabels[vehicle.type]} {vehicleSizeLabels[vehicle.size].label}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setSelectedVehicleId(vehicle.id)}>Solicitar serviço</Button>
                        <Button size="sm" variant="outline" onClick={() => startEditVehicle(vehicle)}>Editar</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteVehicle(vehicle)}>Excluir</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="border-t pt-4 grid gap-3 md:grid-cols-4">
                <Input placeholder="Placa" value={vehicleForm.plate} onChange={(e) => setVehicleForm((prev) => ({ ...prev, plate: e.target.value }))} />
                <Input placeholder="Marca" value={vehicleForm.brand} onChange={(e) => setVehicleForm((prev) => ({ ...prev, brand: e.target.value }))} />
                <Input placeholder="Modelo" value={vehicleForm.model} onChange={(e) => setVehicleForm((prev) => ({ ...prev, model: e.target.value }))} />
                <Input placeholder="Ano" value={vehicleForm.year} onChange={(e) => setVehicleForm((prev) => ({ ...prev, year: e.target.value }))} />
                <Select value={vehicleForm.type} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, type: value as VehicleType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="caminhao">Caminhão</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vehicleForm.size} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, size: value as VehicleSize }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P">P</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Cor" value={vehicleForm.color} onChange={(e) => setVehicleForm((prev) => ({ ...prev, color: e.target.value }))} />
                <Input placeholder="KM" value={vehicleForm.km} onChange={(e) => setVehicleForm((prev) => ({ ...prev, km: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveVehicle}>{editingVehicleId ? 'Salvar veículo' : 'Cadastrar veículo'}</Button>
                {editingVehicleId && <Button variant="outline" onClick={() => { setEditingVehicleId(null); setVehicleForm(emptyVehicleForm); }}>Cancelar</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Solicitar novo serviço</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Veículo</Label>
                  <Select value={selectedVehicleId} onValueChange={(value) => { setSelectedVehicleId(value); setSelectedServiceId(''); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.brand} {vehicle.model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Serviço disponível</Label>
                  <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                    <SelectTrigger><SelectValue placeholder={selectedVehicle ? 'Selecione um serviço' : 'Escolha o veículo primeiro'} /></SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={pickupDelivery} onCheckedChange={setPickupDelivery} id="pickup-request" />
                <Label htmlFor="pickup-request">Solicitar busca em casa (Leva e Traz)</Label>
              </div>
              {pickupDelivery && !customer.address && <p className="text-xs text-destructive">Cadastre endereço para habilitar a busca em casa.</p>}

              <Button onClick={handleRequest}>Enviar solicitação</Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Acompanhamento das ordens</h2>

            <Card>
              <CardHeader><CardTitle>Ordens abertas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {openOrders.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ordem aberta.</p>}
                <div className="grid gap-3 md:grid-cols-2">
                  {openOrders.map((order) => (
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Histórico (fechadas por data)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {closedOrdersByDate.length === 0 && <p className="text-sm text-muted-foreground">Sem ordens finalizadas.</p>}
                {closedOrdersByDate.map(([dateKey, groupedOrders]) => (
                  <div key={dateKey} className="space-y-2">
                    <h3 className="text-sm font-semibold">{dateKey}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {groupedOrders.map((order) => (
                        <Card key={order.id} className={getStatusColorClass(order.status, settings.customStatuses)}>
                          <CardContent className="pt-4 text-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">OS #{order.id.slice(-4)}</p>
                              <Badge variant="outline">{getOrderStatusLabel(order.status, settings.customStatuses)}</Badge>
                            </div>
                            <p>{order.vehiclePlate} • {vehicleTypeLabels[order.vehicleType]} {vehicleSizeLabels[order.size].label}</p>
                            <p className="text-muted-foreground">Encerramento/registro: {order.date}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerPortal;
