import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import PlateSearch from '@/components/PlateSearch';
import CustomerForm from '@/components/CustomerForm';
import VehicleInfoBar from '@/components/VehicleSizeSelector';
import ServiceGrid from '@/components/ServiceGrid';
import Cart from '@/components/Cart';
import VehicleChecklist from '@/components/VehicleChecklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Wrench } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { step, currentVehicle } = useApp();
  const [activeTab, setActiveTab] = useState('services');

  const handleChecklistSave = (data: { type: 'entry' | 'exit'; items: Record<string, { checked: boolean; note: string }>; generalObs: string }) => {
    // Save to localStorage for now
    const key = `arycar_checklist_${currentVehicle?.plate}_${data.type}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
    toast.success(`Checklist de ${data.type === 'entry' ? 'entrada' : 'saída'} salvo com sucesso!`);
  };

  if (step === 'plate') return <PlateSearch />;
  if (step === 'register') return <CustomerForm />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <VehicleInfoBar />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="services" className="gap-2">
              <Wrench className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="checklist-entry" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Checklist Entrada
            </TabsTrigger>
            <TabsTrigger value="checklist-exit" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Checklist Saída
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <ServiceGrid />
          </TabsContent>

          <TabsContent value="checklist-entry">
            {currentVehicle && (
              <VehicleChecklist
                type="entry"
                vehiclePlate={currentVehicle.plate}
                onSave={handleChecklistSave}
              />
            )}
          </TabsContent>

          <TabsContent value="checklist-exit">
            {currentVehicle && (
              <VehicleChecklist
                type="exit"
                vehiclePlate={currentVehicle.plate}
                onSave={handleChecklistSave}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Cart />
    </div>
  );
};

export default Dashboard;
