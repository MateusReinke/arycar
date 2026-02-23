import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Car, Edit, MapPin, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { backendApi } from '@/services/backendApi';
import { storageService } from '@/services/storage';
import { Customer, UserRole, Vehicle, VehicleSize, VehicleType, vehicleSizeLabels, vehicleTypeLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const formatPhone = (val: string) => {
  const nums = val.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
};

const formatCpf = (val: string) => {
  const nums = val.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
};

const normalizePlate = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

const defaultAddress = {
  cep: '',
  street: '',
  number: '',
  district: '',
  city: '',
  state: '',
  complement: '',
};

const toUsername = (name: string) => {
  const chunks = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (chunks.length <= 1) return chunks[0] || 'cliente';
  return `${chunks[0]}.${chunks[chunks.length - 1]}`;
};

const CustomerVehicleManager = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => storageService.getVehicles());

  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerEditingId, setCustomerEditingId] = useState<string | null>(null);

  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [vehicleEditingId, setVehicleEditingId] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    userType: 'cliente',
    role: 'customer' as UserRole,
    addressLabel: 'Principal',
    ...defaultAddress,
    whatsappNotifications: false,
  });

  const [vehicleForm, setVehicleForm] = useState({
    customerId: '',
    plate: '',
    type: 'carro' as VehicleType,
    size: 'M' as VehicleSize,
    brand: '',
    model: '',
    color: '',
    year: '',
    km: '',
  });
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [lastResolvedCep, setLastResolvedCep] = useState('');
  const cepDebounceRef = useRef<number | null>(null);

  const refresh = () => {
    setCustomers(storageService.getCustomers());
    setVehicles(storageService.getVehicles());
  };

  const resetCustomerForm = () => {
    setCustomerEditingId(null);
    setCustomerForm({
      name: '',
      cpf: '',
      phone: '',
      email: '',
      userType: 'cliente',
      role: 'customer',
      addressLabel: 'Principal',
      ...defaultAddress,
      whatsappNotifications: false,
    });
  };

  const resetVehicleForm = () => {
    setVehicleEditingId(null);
    setVehicleForm({ customerId: '', plate: '', type: 'carro', size: 'M', brand: '', model: '', color: '', year: '', km: '' });
  };

  const vehiclesByCustomer = useMemo(() => {
    return vehicles.reduce<Record<string, Vehicle[]>>((acc, vehicle) => {
      acc[vehicle.customerId] = [...(acc[vehicle.customerId] || []), vehicle];
      return acc;
    }, {});
  }, [vehicles]);

  const fillAddressByCep = async (cep: string) => {
    if (cep.length !== 8 || isLoadingCep || lastResolvedCep === cep) return;

    setIsLoadingCep(true);

    const applyAddress = (payload: { street?: string; district?: string; city?: string; state?: string }) => {
      setCustomerForm((prev) => ({
        ...prev,
        cep,
        street: payload.street || prev.street,
        district: payload.district || prev.district,
        city: payload.city || prev.city,
        state: (payload.state || prev.state || '').toUpperCase().slice(0, 2),
      }));
      setLastResolvedCep(cep);
      toast.success('Endereço preenchido automaticamente pelo CEP.');
    };

    try {
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { cache: 'no-store' });
      if (!viaCepResponse.ok) throw new Error('viacep_http_error');
      const viaCepData = await viaCepResponse.json() as Record<string, string | boolean>;

      if (!viaCepData.erro) {
        applyAddress({
          street: String(viaCepData.logradouro || ''),
          district: String(viaCepData.bairro || ''),
          city: String(viaCepData.localidade || ''),
          state: String(viaCepData.uf || ''),
        });
        return;
      }

      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, { cache: 'no-store' });
      if (!brasilApiResponse.ok) throw new Error('brasilapi_http_error');
      const brasilApiData = await brasilApiResponse.json() as Record<string, string>;

      applyAddress({
        street: String(brasilApiData.street || ''),
        district: String(brasilApiData.neighborhood || ''),
        city: String(brasilApiData.city || ''),
        state: String(brasilApiData.state || ''),
      });
    } catch (_error) {
      setLastResolvedCep('');
      toast.error('Não foi possível consultar o CEP agora. Verifique a conexão no deploy.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  useEffect(() => {
    const cep = customerForm.cep.replace(/\D/g, '');

    if (cep.length !== 8) {
      setLastResolvedCep('');
      if (cepDebounceRef.current) {
        window.clearTimeout(cepDebounceRef.current);
        cepDebounceRef.current = null;
      }
      return;
    }

    if (cepDebounceRef.current) {
      window.clearTimeout(cepDebounceRef.current);
    }

    cepDebounceRef.current = window.setTimeout(() => {
      fillAddressByCep(cep);
    }, 350);

    return () => {
      if (cepDebounceRef.current) {
        window.clearTimeout(cepDebounceRef.current);
        cepDebounceRef.current = null;
      }
    };
  }, [customerForm.cep]);

  const upsertCustomer = async () => {
    if (!customerForm.name.trim()) {
      toast.error('Nome do cliente é obrigatório.');
      return;
    }

    if (customerForm.phone.replace(/\D/g, '').length < 10) {
      toast.error('Telefone inválido.');
      return;
    }

    const normalizedPhone = customerForm.phone.replace(/\D/g, '');
    const username = toUsername(customerForm.name);
    const fullAddress = [
      customerForm.street,
      customerForm.number,
      customerForm.district,
      `${customerForm.city}/${customerForm.state}`,
    ].filter(Boolean).join(', ');

    const existing = customerEditingId ? customers.find((item) => item.id === customerEditingId) : undefined;

    const nextCustomer: Customer = {
      id: existing?.id || crypto.randomUUID(),
      name: customerForm.name.trim(),
      cpf: customerForm.cpf.replace(/\D/g, ''),
      phone: normalizedPhone,
      email: customerForm.email.trim(),
      address: fullAddress,
      userType: customerForm.userType as Customer['userType'],
      username,
      role: customerForm.role,
      forcePasswordChange: existing?.forcePasswordChange ?? true,
      whatsappNotifications: customerForm.whatsappNotifications,
      addresses: [{
        id: existing?.addresses?.[0]?.id || crypto.randomUUID(),
        label: customerForm.addressLabel || 'Principal',
        cep: customerForm.cep,
        street: customerForm.street,
        number: customerForm.number,
        district: customerForm.district,
        city: customerForm.city,
        state: customerForm.state,
        complement: customerForm.complement,
      }],
    };

    if (customerEditingId) {
      storageService.updateCustomer(nextCustomer);
      toast.success('Cliente atualizado com sucesso.');
    } else {
      storageService.addCustomer(nextCustomer);
      try {
        await backendApi.createUser({
          name: nextCustomer.name,
          phone: nextCustomer.phone,
          email: nextCustomer.email || `${username}@arycar.cliente`,
          role: 'customer',
          password: nextCustomer.phone,
          address: nextCustomer.address,
          cpf: nextCustomer.cpf,
        });
      } catch (_error) {
        toast.warning('Cliente salvo localmente. Não foi possível criar o login no backend agora.');
      }
      toast.success(`Cliente criado. Usuário padrão: ${username} | Senha padrão: celular cadastrado.`);
    }

    setCustomerOpen(false);
    resetCustomerForm();
    refresh();
  };

  const removeCustomer = (customerId: string) => {
    const nextCustomers = customers.filter((item) => item.id !== customerId);
    const nextVehicles = vehicles.filter((item) => item.customerId !== customerId);
    storageService.saveCustomers(nextCustomers);
    storageService.saveVehicles(nextVehicles);
    refresh();
    toast.success('Cliente e veículos vinculados removidos.');
  };

  const openEditCustomer = (customer: Customer) => {
    setCustomerEditingId(customer.id);
    const address = customer.addresses?.[0];
    setCustomerForm({
      name: customer.name,
      cpf: formatCpf(customer.cpf || ''),
      phone: formatPhone(customer.phone || ''),
      email: customer.email || '',
      userType: customer.userType || 'cliente',
      role: customer.role || 'customer',
      addressLabel: address?.label || 'Principal',
      cep: address?.cep || '',
      street: address?.street || '',
      number: address?.number || '',
      district: address?.district || '',
      city: address?.city || '',
      state: address?.state || '',
      complement: address?.complement || '',
      whatsappNotifications: customer.whatsappNotifications || false,
    });
    setCustomerOpen(true);
  };

  const upsertVehicle = () => {
    if (!vehicleForm.customerId) {
      toast.error('Selecione o cliente do veículo.');
      return;
    }

    if (vehicleForm.plate.length < 7) {
      toast.error('Placa inválida.');
      return;
    }

    const payload: Vehicle = {
      id: vehicleEditingId || crypto.randomUUID(),
      customerId: vehicleForm.customerId,
      plate: vehicleForm.plate,
      type: vehicleForm.type,
      size: vehicleForm.size,
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      color: vehicleForm.color,
      year: vehicleForm.year,
      km: vehicleForm.km,
    };

    if (vehicleEditingId) {
      storageService.saveVehicles(vehicles.map((item) => item.id === vehicleEditingId ? payload : item));
      toast.success('Veículo atualizado com sucesso.');
    } else {
      storageService.addVehicle(payload);
      toast.success('Veículo adicionado com sucesso.');
    }

    setVehicleOpen(false);
    resetVehicleForm();
    refresh();
  };

  const removeVehicle = (vehicleId: string) => {
    storageService.saveVehicles(vehicles.filter((item) => item.id !== vehicleId));
    refresh();
    toast.success('Veículo removido.');
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setVehicleEditingId(vehicle.id);
    setVehicleForm(vehicle);
    setVehicleOpen(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><UserCircle2 className="h-5 w-5" />Clientes</CardTitle>
          <Button size="sm" onClick={() => { resetCustomerForm(); setCustomerOpen(true); }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {customers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>}
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-muted-foreground">{formatPhone(customer.phone)} • @{customer.username || toUsername(customer.name)}</p>
                  <p className="text-muted-foreground">Tipo: {customer.userType || 'cliente'} • Notificações WhatsApp: {customer.whatsappNotifications ? 'Sim' : 'Não'}</p>
                  <p className="text-xs mt-1">Veículos: {vehiclesByCustomer[customer.id]?.length || 0}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={() => openEditCustomer(customer)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => removeCustomer(customer.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />Veículos</CardTitle>
          <Button size="sm" onClick={() => { resetVehicleForm(); setVehicleOpen(true); }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {vehicles.length === 0 && <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>}
          {vehicles.map((vehicle) => {
            const owner = customers.find((item) => item.id === vehicle.customerId);
            return (
              <div key={vehicle.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{vehicle.plate} • {vehicle.brand} {vehicle.model}</p>
                    <p className="text-muted-foreground">Cliente: {owner?.name || 'Não encontrado'}</p>
                    <p className="text-muted-foreground">{vehicleTypeLabels[vehicle.type]} / {vehicleSizeLabels[vehicle.size].label} • KM: {vehicle.km || '-'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={() => openEditVehicle(vehicle)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => removeVehicle(vehicle.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{customerEditingId ? 'Editar cliente' : 'Novo cliente'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Nome completo *</Label><Input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} /></div>
            <div><Label>Tipo do usuário</Label><Select value={customerForm.userType} onValueChange={(v) => setCustomerForm({ ...customerForm, userType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cliente"><span className="flex items-center gap-1"><UserCircle2 className="h-3 w-3" />Cliente</span></SelectItem><SelectItem value="empresa"><span className="flex items-center gap-1"><Building2 className="h-3 w-3" />Empresa</span></SelectItem></SelectContent></Select></div>
            <div><Label>CPF</Label><Input value={customerForm.cpf} onChange={(e) => setCustomerForm({ ...customerForm, cpf: formatCpf(e.target.value) })} /></div>
            <div><Label>Celular *</Label><Input value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: formatPhone(e.target.value) })} /></div>
            <div className="md:col-span-2"><Label>E-mail</Label><Input value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} /></div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-semibold flex items-center gap-1"><MapPin className="h-4 w-4" />Endereço para Leva e Traz</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Rótulo</Label><Input value={customerForm.addressLabel} onChange={(e) => setCustomerForm({ ...customerForm, addressLabel: e.target.value })} /></div>
              <div>
                <Label>CEP</Label>
                <Input
                  value={customerForm.cep}
                  onChange={(e) => setCustomerForm({ ...customerForm, cep: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  placeholder="Digite 8 dígitos"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {isLoadingCep ? 'Consultando CEP...' : 'Busca automática ao completar 8 dígitos.'}
                </p>
              </div>
              <div className="md:col-span-2"><Label>Rua</Label><Input value={customerForm.street} onChange={(e) => setCustomerForm({ ...customerForm, street: e.target.value })} /></div>
              <div><Label>Número</Label><Input value={customerForm.number} onChange={(e) => setCustomerForm({ ...customerForm, number: e.target.value })} /></div>
              <div><Label>Bairro</Label><Input value={customerForm.district} onChange={(e) => setCustomerForm({ ...customerForm, district: e.target.value })} /></div>
              <div><Label>Cidade</Label><Input value={customerForm.city} onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })} /></div>
              <div><Label>UF</Label><Input value={customerForm.state} onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value.toUpperCase().slice(0, 2) })} /></div>
              <div className="md:col-span-3"><Label>Complemento</Label><Input value={customerForm.complement} onChange={(e) => setCustomerForm({ ...customerForm, complement: e.target.value })} /></div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Receber notificações via WhatsApp</p>
              <p className="text-xs text-muted-foreground">Cliente escolhe se quer receber atualização do andamento do serviço.</p>
            </div>
            <Switch checked={customerForm.whatsappNotifications} onCheckedChange={(checked) => setCustomerForm({ ...customerForm, whatsappNotifications: checked })} />
          </div>

          <Button onClick={upsertCustomer}>{customerEditingId ? 'Salvar alterações' : 'Cadastrar cliente'}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={vehicleOpen} onOpenChange={setVehicleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{vehicleEditingId ? 'Editar veículo' : 'Novo veículo'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Cliente *</Label>
              <Select value={vehicleForm.customerId} onValueChange={(value) => setVehicleForm({ ...vehicleForm, customerId: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Placa *</Label><Input value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: normalizePlate(e.target.value) })} /></div>
            <div><Label>Ano</Label><Input value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })} /></div>
            <div><Label>Tipo</Label><Select value={vehicleForm.type} onValueChange={(value: VehicleType) => setVehicleForm({ ...vehicleForm, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="carro">Carro</SelectItem><SelectItem value="moto">Moto</SelectItem><SelectItem value="caminhao">Caminhão</SelectItem></SelectContent></Select></div>
            <div><Label>Porte</Label><Select value={vehicleForm.size} onValueChange={(value: VehicleSize) => setVehicleForm({ ...vehicleForm, size: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="P">Pequeno</SelectItem><SelectItem value="M">Médio</SelectItem><SelectItem value="G">Grande</SelectItem></SelectContent></Select></div>
            <div><Label>Marca</Label><Input value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} /></div>
            <div><Label>Modelo</Label><Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} /></div>
            <div><Label>Cor</Label><Input value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} /></div>
            <div><Label>KM</Label><Input value={vehicleForm.km} onChange={(e) => setVehicleForm({ ...vehicleForm, km: e.target.value })} /></div>
          </div>
          <Button onClick={upsertVehicle}>{vehicleEditingId ? 'Salvar veículo' : 'Cadastrar veículo'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerVehicleManager;
