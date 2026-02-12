import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { storageService } from '@/services/storage';
import { Customer, Vehicle, VehicleType, VehicleSize, vehicleTypeLabels, vehicleSizeLabels } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus, Car, Bike, Truck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { lookupPlate, translateSubSegmentToSize, translateVehicleType } from '@/services/plateApi';
import { fetchFipeBrands, fetchFipeModels, type FipeBrand, type FipeModel } from '@/services/fipeApi';
import { isPlateApiConfigured } from '@/config/api';

const vehicleTypeIcons: Record<VehicleType, React.ReactNode> = {
  carro: <Car className="h-6 w-6" />,
  moto: <Bike className="h-6 w-6" />,
  caminhao: <Truck className="h-6 w-6" />,
};

const CustomerForm = () => {
  const { setStep, setCurrentCustomer, setCurrentVehicle, pendingPlate } = useApp();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [plate, setPlate] = useState(pendingPlate || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>('carro');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>('M');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [year, setYear] = useState('');
  const [km, setKm] = useState('');

  // FIPE state
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [models, setModels] = useState<FipeModel[]>([]);
  const [selectedBrandCode, setSelectedBrandCode] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);

  // Plate API state
  const [lookingUpPlate, setLookingUpPlate] = useState(false);
  const [plateLooked, setPlateLooked] = useState(false);

  // Auto-lookup plate on mount
  useEffect(() => {
    if (pendingPlate && isPlateApiConfigured() && !plateLooked) {
      handlePlateLookup(pendingPlate);
    }
  }, [pendingPlate]);

  // Load FIPE brands when vehicle type changes
  useEffect(() => {
    if (!useManualEntry) return;
    setLoadingBrands(true);
    setBrands([]);
    setModels([]);
    setSelectedBrandCode('');
    setBrand('');
    setModel('');
    fetchFipeBrands(vehicleType).then(b => {
      setBrands(b);
      setLoadingBrands(false);
    });
  }, [vehicleType, useManualEntry]);

  // Load FIPE models when brand changes
  useEffect(() => {
    if (!selectedBrandCode || !useManualEntry) return;
    setLoadingModels(true);
    setModels([]);
    setModel('');
    fetchFipeModels(vehicleType, selectedBrandCode).then(m => {
      setModels(m);
      setLoadingModels(false);
    });
  }, [selectedBrandCode, vehicleType, useManualEntry]);

  const handlePlateLookup = async (plateValue: string) => {
    setLookingUpPlate(true);
    setPlateLooked(true);
    const data = await lookupPlate(plateValue);
    setLookingUpPlate(false);

    if (data) {
      setBrand(data.marca || '');
      setModel(data.modelo || '');
      setYear(data.ano_fabricacao || data.ano_modelo || '');
      setColor(data.cor || '');
      const detectedType = translateVehicleType(data.tipo_veiculo || '', data.segmento || '');
      setVehicleType(detectedType);
      setVehicleSize(translateSubSegmentToSize(data.sub_segmento || ''));
      toast.success('Dados do veículo preenchidos automaticamente!');
    } else {
      toast.info('Veículo não encontrado na API. Use a tabela FIPE ou preencha manualmente.');
      setUseManualEntry(true);
    }
  };

  const handleBrandSelect = (code: string) => {
    setSelectedBrandCode(code);
    const found = brands.find(b => b.codigo === code);
    setBrand(found?.nome || '');
  };

  const handleModelSelect = (code: string) => {
    const found = models.find(m => m.codigo.toString() === code);
    setModel(found?.nome || '');
  };

  const formatCpf = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (cpf.replace(/\D/g, '').length < 11) { toast.error('CPF inválido'); return; }
    if (!plate.trim() || plate.length < 7) { toast.error('Placa inválida'); return; }
    if (!km.trim()) { toast.error('KM atual é obrigatório'); return; }

    const existingCustomer = storageService.findCustomerByCpf(cpf.replace(/\D/g, ''));

    let customer: Customer;
    if (existingCustomer) {
      customer = existingCustomer;
      toast.info(`Cliente ${customer.name} já cadastrado. Adicionando veículo.`);
    } else {
      customer = {
        id: Date.now().toString(),
        name: name.trim(),
        cpf: cpf.replace(/\D/g, ''),
        phone: phone.replace(/\D/g, ''),
        address: address.trim(),
      };
      storageService.addCustomer(customer);
    }

    const vehicle: Vehicle = {
      id: (Date.now() + 1).toString(),
      plate: plate.toUpperCase(),
      type: vehicleType,
      size: vehicleSize,
      brand: brand.trim(),
      model: model.trim(),
      color: color.trim(),
      year: year.trim(),
      km: km.trim(),
      customerId: customer.id,
    };
    storageService.addVehicle(vehicle);

    setCurrentCustomer(customer);
    setCurrentVehicle(vehicle);
    setStep('services');
    toast.success('Cadastro realizado com sucesso!');
  };

  return (
    <div className="container max-w-2xl py-6">
      <Button variant="ghost" className="mb-4" onClick={() => setStep('plate')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastro de Cliente e Veículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading plate API */}
          {lookingUpPlate && (
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Consultando placa {plate}...</span>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados do Cliente</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Nome Completo *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="João da Silva" />
              </div>
              <div>
                <Label className="text-xs">CPF *</Label>
                <Input value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label className="text-xs">Endereço (Leva e Traz)</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, nº - Bairro - Cidade" />
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Dados do Veículo</h3>

            {/* Vehicle Type Selector */}
            <div>
              <Label className="text-xs mb-2 block">Tipo de Veículo *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(vehicleTypeLabels) as VehicleType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setVehicleType(type)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all',
                      vehicleType === type
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <span className={cn(vehicleType === type ? 'text-primary' : 'text-muted-foreground')}>
                      {vehicleTypeIcons[type]}
                    </span>
                    <span className={cn('text-sm font-semibold', vehicleType === type ? 'text-primary' : 'text-foreground')}>
                      {vehicleTypeLabels[type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Size */}
            <div>
              <Label className="text-xs mb-2 block">Porte *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(vehicleSizeLabels) as VehicleSize[]).map(size => (
                  <button
                    key={size}
                    onClick={() => setVehicleSize(size)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all',
                      vehicleSize === size
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <span className={cn('text-xl font-bold', vehicleSize === size ? 'text-primary' : 'text-foreground')}>
                      {size}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{vehicleSizeLabels[size].label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Placa *</Label>
                <Input
                  value={plate}
                  onChange={e => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                  placeholder="ABC1D23"
                  className="uppercase tracking-wider"
                  disabled
                />
              </div>
              <div>
                <Label className="text-xs">KM Atual *</Label>
                <Input
                  value={km}
                  onChange={e => setKm(e.target.value.replace(/\D/g, ''))}
                  placeholder="45000"
                />
              </div>
            </div>

            {/* FIPE Dropdowns or Manual Entry */}
            {useManualEntry && !brand ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Marca (FIPE)</Label>
                  {loadingBrands ? (
                    <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando marcas...
                    </div>
                  ) : (
                    <Select onValueChange={handleBrandSelect} value={selectedBrandCode}>
                      <SelectTrigger><SelectValue placeholder="Selecione a marca" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {brands.map(b => (
                          <SelectItem key={b.codigo} value={b.codigo}>{b.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Modelo (FIPE)</Label>
                  {loadingModels ? (
                    <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando modelos...
                    </div>
                  ) : (
                    <Select onValueChange={handleModelSelect} disabled={!selectedBrandCode}>
                      <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {models.map(m => (
                          <SelectItem key={m.codigo} value={m.codigo.toString()}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs">Marca</Label>
                  <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Toyota" />
                </div>
                <div>
                  <Label className="text-xs">Modelo</Label>
                  <Input value={model} onChange={e => setModel(e.target.value)} placeholder="Corolla" />
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Cor</Label>
                <Input value={color} onChange={e => setColor(e.target.value)} placeholder="Prata" />
              </div>
              <div>
                <Label className="text-xs">Ano</Label>
                <Input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" />
              </div>
            </div>

            {useManualEntry && brand && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setUseManualEntry(false)}>
                Preencher marca/modelo manualmente
              </Button>
            )}
            {!useManualEntry && !lookingUpPlate && (
              <Button variant="link" size="sm" className="text-xs p-0 h-auto" onClick={() => setUseManualEntry(true)}>
                Buscar marca/modelo pela tabela FIPE
              </Button>
            )}
          </div>

          <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={lookingUpPlate}>
            <UserPlus className="mr-2 h-5 w-5" />
            Cadastrar e Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerForm;
