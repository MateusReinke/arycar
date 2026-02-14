import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { storageService } from '@/services/storage';
import { vehicleTypeLabels, vehicleSizeLabels } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Car, Bike, Truck, User, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import arycarLogo from '@/assets/arycar-logo.png';

const vehicleTypeIcons = {
  carro: Car,
  moto: Bike,
  caminhao: Truck,
};

const ReturningVehicle = () => {
  const { currentCustomer, currentVehicle, setCurrentVehicle, setStep, resetFlow } = useApp();
  const [km, setKm] = useState(currentVehicle?.km || '');

  if (!currentCustomer || !currentVehicle) return null;

  const Icon = vehicleTypeIcons[currentVehicle.type];
  const otherVehicles = storageService.getVehiclesByCustomer(currentCustomer.id).filter(v => v.id !== currentVehicle.id);

  const handleContinue = () => {
    if (!km.trim()) {
      toast.error('Informe o KM atual do veículo');
      return;
    }

    // Update vehicle KM
    const updatedVehicle = { ...currentVehicle, km: km.trim() };
    const vehicles = storageService.getVehicles().map(v => v.id === updatedVehicle.id ? updatedVehicle : v);
    storageService.saveVehicles(vehicles);
    setCurrentVehicle(updatedVehicle);

    setStep('services');
    toast.success('Veículo selecionado! Escolha os serviços.');
  };

  const handleSelectOtherVehicle = (vehicleId: string) => {
    const vehicle = storageService.getVehicles().find(v => v.id === vehicleId);
    if (vehicle) {
      setCurrentVehicle(vehicle);
      setKm(vehicle.km || '');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <img src={arycarLogo} alt="ARYCAR" className="h-16 w-auto mx-auto" />
          <h1 className="text-xl font-bold">Cliente Encontrado</h1>
        </div>

        <Button variant="ghost" size="sm" onClick={resetFlow}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        {/* Customer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              {currentCustomer.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>CPF: {currentCustomer.cpf}</p>
            {currentCustomer.phone && <p>Tel: {currentCustomer.phone}</p>}
            {currentCustomer.address && <p>End: {currentCustomer.address}</p>}
          </CardContent>
        </Card>

        {/* Current Vehicle */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="h-5 w-5 text-primary" />
              Veículo Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                {currentVehicle.plate}
              </Badge>
              <div className="flex-1">
                <p className="font-medium">{currentVehicle.brand} {currentVehicle.model}</p>
                <p className="text-xs text-muted-foreground">
                  {vehicleTypeLabels[currentVehicle.type]} • Porte {vehicleSizeLabels[currentVehicle.size].label} • {currentVehicle.color} • {currentVehicle.year}
                </p>
              </div>
              <Badge className="shrink-0">{currentVehicle.size}</Badge>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1 mb-1">
                <Gauge className="h-3 w-3" />
                KM Atual *
              </Label>
              <Input
                value={km}
                onChange={e => setKm(e.target.value.replace(/\D/g, ''))}
                placeholder="Informe o KM atual"
                className="text-lg font-semibold"
                autoFocus
              />
              {currentVehicle.km && (
                <p className="text-xs text-muted-foreground mt-1">
                  Último registro: {currentVehicle.km} km
                </p>
              )}
            </div>

            <Button className="w-full h-12 text-base" onClick={handleContinue}>
              <ArrowRight className="mr-2 h-5 w-5" />
              Selecionar Serviços
            </Button>
          </CardContent>
        </Card>

        {/* Other Vehicles */}
        {otherVehicles.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Outros veículos deste cliente ({otherVehicles.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {otherVehicles.map(v => {
                const VIcon = vehicleTypeIcons[v.type];
                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelectOtherVehicle(v.id)}
                    className="w-full flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
                  >
                    <VIcon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-mono">{v.plate}</Badge>
                    <span className="text-sm flex-1">{v.brand} {v.model}</span>
                    <Badge variant="secondary" className="text-xs">{v.size}</Badge>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReturningVehicle;
