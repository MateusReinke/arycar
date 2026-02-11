import { useApp } from '@/context/AppContext';
import PlateSearch from '@/components/PlateSearch';
import CustomerForm from '@/components/CustomerForm';
import VehicleInfoBar from '@/components/VehicleSizeSelector';
import ServiceGrid from '@/components/ServiceGrid';
import Cart from '@/components/Cart';

const Index = () => {
  const { step } = useApp();

  if (step === 'plate') return <PlateSearch />;
  if (step === 'register') return <CustomerForm />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <VehicleInfoBar />
        <ServiceGrid />
      </main>
      <Cart />
    </div>
  );
};

export default Index;
