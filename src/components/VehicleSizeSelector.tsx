import { Car, Bike, Truck, ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { vehicleTypeLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const vehicleTypeIcons = {
  carro: Car,
  moto: Bike,
  caminhao: Truck,
};

const VehicleInfoBar = () => {
  const { currentCustomer, currentVehicle, resetFlow } = useApp();

  if (!currentCustomer || !currentVehicle) return null;

  const Icon = vehicleTypeIcons[currentVehicle.type];

  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl bg-card p-4 border border-border">
      <Button variant="ghost" size="icon" className="shrink-0" onClick={resetFlow}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Icon className="h-8 w-8 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{currentCustomer.name}</p>
        <p className="text-xs text-muted-foreground">
          {vehicleTypeLabels[currentVehicle.type]} • {currentVehicle.brand} {currentVehicle.model} • {currentVehicle.plate}
        </p>
      </div>
      <Badge variant="outline" className="text-lg font-bold px-3 py-1 shrink-0">
        {currentVehicle.size}
      </Badge>
    </div>
  );
};

export default VehicleInfoBar;
