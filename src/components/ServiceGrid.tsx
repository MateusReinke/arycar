import { useApp } from '@/context/AppContext';
import ServiceCard from './ServiceCard';

const ServiceGrid = () => {
  const { services } = useApp();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Serviços Disponíveis</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(service => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
};

export default ServiceGrid;
