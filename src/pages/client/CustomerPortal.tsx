import { useMemo, useState } from 'react';
import { storageService } from '@/services/storage';
import { useAuth } from '@/context/AuthContext';
import { getOrderStatusLabel, getStatusColorClass, Vehicle, VehicleSize, VehicleType, vehicleSizeLabels, vehicleTypeLabels } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { backendApi } from '@/services/backendApi';

const CustomerPortal = () => {
  const { user } = useAuth();
  const settings = storageService.getSettings();
  const [orders, setOrders] = useState(() => storageService.getOrdersByCustomerPhone(user?.phone || ''));
  const customer = useMemo(() => {
    const phone = (user?.phone || '').replace(/\D/g, '');
    return storageService.getCustomers().find((item) => item.phone === phone);
  }, [user]);

  const [customerDraft, setCustomerDraft] = useState(() => ({
    email: customer?.email || user?.email || '',
    address: customer?.address || '',
    whatsappNotifications: Boolean(customer?.whatsappNotifications),
  }));

  const vehicles = useMemo(
    () => customer ? storageService.getVehiclesByCustomer(customer.id) : [],
    [customer],
  );

  const [vehicleId, setVehicleId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [pickupDelivery, setPickupDelivery] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    type: 'carro' as VehicleType,
    size: 'M' as VehicleSize,
    brand: '',
    model: '',
    color: '',
    year: '',
    km: '',
  });
  const [passwordModalOpen, setPasswordModalOpen] = useState(Boolean(customer?.forcePasswordChange));
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');

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

  const saveCustomerData = () => {
    if (!customer) return;
    const next = {
      ...customer,
      email: customerDraft.email,
      address: customerDraft.address,
      whatsappNotifications: customerDraft.whatsappNotifications,
    };
    storageService.updateCustomer(next);
    toast.success('Dados da conta atualizados.');
  };

  const saveVehicle = () => {
    if (!customer) return;
    if (newVehicle.plate.length < 7) {
      toast.error('Informe uma placa válida.');
      return;
    }

    const payload: Vehicle = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      ...newVehicle,
      plate: newVehicle.plate.toUpperCase(),
    };

    storageService.addVehicle(payload);
    setNewVehicle({ plate: '', type: 'carro', size: 'M', brand: '', model: '', color: '', year: '', km: '' });
    toast.success('Veículo cadastrado.');
    window.location.reload();
  };

  const updatePasswordFirstAccess = async () => {
    if (!user?.id || !customer) return;
    try {
      await backendApi.updateUserPassword(user.id, {
        currentPassword: currentPassword || customer.phone,
        newPassword: nextPassword,
      });

      storageService.updateCustomer({ ...customer, forcePasswordChange: false });
      setPasswordModalOpen(false);
      toast.success('Senha atualizada com sucesso.');
    } catch (_error) {
      toast.error('Não foi possível trocar a senha agora. Confira os dados e tente novamente.');
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Área do Cliente</h1>

      <Dialog open={passwordModalOpen} onOpenChange={() => null}>
        <DialogContent>
          <DialogHeader><DialogTitle>Primeiro acesso: troque sua senha</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Por segurança, atualize sua senha padrão (celular cadastrado) antes de continuar.</p>
          <div className="space-y-3">
            <div><Label>Senha atual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Seu celular cadastrado" /></div>
            <div><Label>Nova senha</Label><Input type="password" value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} placeholder="Nova senha" /></div>
          </div>
          <Button onClick={updatePasswordFirstAccess}>Atualizar senha</Button>
        </DialogContent>
      </Dialog>

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
        <>
          <Card>
            <CardHeader><CardTitle>Minha conta</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div><Label>Nome</Label><Input value={customer.name} disabled /></div>
              <div><Label>Celular</Label><Input value={customer.phone} disabled /></div>
              <div><Label>E-mail</Label><Input value={customerDraft.email} onChange={(e) => setCustomerDraft({ ...customerDraft, email: e.target.value })} /></div>
              <div><Label>Endereço para Leva e Traz</Label><Input value={customerDraft.address} onChange={(e) => setCustomerDraft({ ...customerDraft, address: e.target.value })} /></div>
              <div className="md:col-span-2 flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">Notificações do andamento via WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Você escolhe se quer receber atualizações automáticas de status.</p>
                </div>
                <Switch checked={customerDraft.whatsappNotifications} onCheckedChange={(checked) => setCustomerDraft({ ...customerDraft, whatsappNotifications: checked })} />
              </div>
              <Button className="md:col-span-2" onClick={saveCustomerData}>Salvar dados da conta</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Meus veículos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="rounded-md border p-3 text-sm">
                    <p className="font-semibold">{vehicle.plate}</p>
                    <p>{vehicle.brand} {vehicle.model}</p>
                    <p className="text-muted-foreground">{vehicleTypeLabels[vehicle.type]} - {vehicleSizeLabels[vehicle.size].label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Adicionar novo veículo</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div><Label>Placa</Label><Input value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7) })} /></div>
                  <div><Label>Marca</Label><Input value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></div>
                  <div><Label>Modelo</Label><Input value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} /></div>
                  <div><Label>Tipo</Label><Select value={newVehicle.type} onValueChange={(value: VehicleType) => setNewVehicle({ ...newVehicle, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="carro">Carro</SelectItem><SelectItem value="moto">Moto</SelectItem><SelectItem value="caminhao">Caminhão</SelectItem></SelectContent></Select></div>
                  <div><Label>Porte</Label><Select value={newVehicle.size} onValueChange={(value: VehicleSize) => setNewVehicle({ ...newVehicle, size: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="P">Pequeno</SelectItem><SelectItem value="M">Médio</SelectItem><SelectItem value="G">Grande</SelectItem></SelectContent></Select></div>
                  <div><Label>Cor</Label><Input value={newVehicle.color} onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })} /></div>
                  <div><Label>Ano</Label><Input value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} /></div>
                  <div><Label>KM</Label><Input value={newVehicle.km} onChange={(e) => setNewVehicle({ ...newVehicle, km: e.target.value })} /></div>
                </div>
                <Button onClick={saveVehicle}>Cadastrar veículo</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitar novo serviço/agendamento</CardTitle>
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
        </>
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
