import VehicleSizeSelector from '@/components/VehicleSizeSelector';
import ServiceGrid from '@/components/ServiceGrid';
import Cart from '@/components/Cart';

const Index = () => {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <VehicleSizeSelector />
        <ServiceGrid />
      </main>
      <Cart />
    </div>
  );
};

export default Index;
