import { useState } from 'react';
import { Search, Car, Bike, Truck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { storageService } from '@/services/storage';
import { backendApi } from '@/services/backendApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import arycarLogo from '@/assets/arycar-logo.png';

const PlateSearch = () => {
  const {
    setStep,
    setCurrentCustomer,
    setCurrentVehicle,
    setPendingPlate,
    setCurrentOpenOrder,
  } = useApp();

  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPlate = (val: string) => {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  };

  const handleSearch = async () => {
    const cleanPlate = formatPlate(plate);
    if (cleanPlate.length < 7) {
      toast.error('Placa inválida. Use o formato ABC1D23 ou ABC1234');
      return;
    }

    setLoading(true);

    try {
      const vehicle = storageService.findVehicleByPlate(cleanPlate);

      if (vehicle) {
        const customer = storageService.findCustomerById(vehicle.customerId);
        if (customer) {
          const openOrder = storageService.findOpenOrderByPlate(cleanPlate);
          setCurrentCustomer(customer);
          setCurrentVehicle(vehicle);

          if (openOrder) {
            setCurrentOpenOrder(openOrder);
            setStep('order-summary');
            toast.warning(`Já existe OS em aberto para esta placa (#${openOrder.id.slice(-4)}).`);
            return;
          }

          setCurrentOpenOrder(null);
          setStep('returning');
          toast.success(`Veículo encontrado! Cliente: ${customer.name}`);
          return;
        }
      }

      const remoteResult = await backendApi.findOpenOrderByPlate(cleanPlate);
      if (remoteResult?.found && remoteResult.customer && remoteResult.vehicle) {
        setCurrentCustomer(remoteResult.customer);
        setCurrentVehicle(remoteResult.vehicle);

        if (remoteResult.openOrder && remoteResult.order) {
          setCurrentOpenOrder({
            id: remoteResult.order.id,
            items: [],
            vehicleType: remoteResult.vehicle.type,
            size: remoteResult.vehicle.size,
            total: remoteResult.order.total,
            date: new Date(remoteResult.order.date).toLocaleString('pt-BR'),
            customerId: remoteResult.customer.id,
            customerName: remoteResult.customer.name,
            vehiclePlate: remoteResult.vehicle.plate,
            pickupDelivery: false,
            status: remoteResult.order.status,
          });
          setStep('order-summary');
          toast.warning('Cliente e OS em aberto encontrados no banco de dados.');
          return;
        }

        setCurrentOpenOrder(null);
        setStep('returning');
        toast.success(`Veículo encontrado no banco! Cliente: ${remoteResult.customer.name}`);
        return;
      }

      toast.info('Veículo não cadastrado. Preencha os dados do cliente.');
      setCurrentOpenOrder(null);
      setPendingPlate(cleanPlate);
      setStep('register');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img src={arycarLogo} alt="ARYCAR" className="h-20 w-auto mx-auto" />
          <div className="flex justify-center gap-4">
            <Car className="h-8 w-8 text-primary" />
            <Bike className="h-8 w-8 text-primary" />
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
          <p className="text-sm text-muted-foreground">
            Digite a placa do veículo para iniciar
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ABC1D23"
              value={plate}
              onChange={e => setPlate(formatPlate(e.target.value))}
              onKeyDown={handleKeyDown}
              className="h-14 pl-11 text-center text-2xl font-bold tracking-[0.3em] uppercase"
              maxLength={7}
              autoFocus
            />
          </div>

          <Button className="w-full h-12 text-base" onClick={() => void handleSearch()} disabled={plate.length < 7 || loading}>
            <Search className="mr-2 h-5 w-5" />
            {loading ? 'Consultando...' : 'Buscar Veículo'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Se houver OS em aberto para a placa, o sistema exibirá um resumo antes de continuar
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlateSearch;
