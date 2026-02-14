import { useApp } from '@/context/AppContext';
import ServiceCard from './ServiceCard';
import { getDisabledServiceIds, getExclusionReason } from '@/data/serviceExclusions';

const ServiceGrid = () => {
  const { availableServices, cart } = useApp();
  const cartIds = cart.map(i => i.service.id);
  const disabledIds = getDisabledServiceIds(cartIds);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Serviços Disponíveis ({availableServices.length})</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {availableServices.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            disabled={disabledIds.has(service.id)}
            disabledReason={getExclusionReason(service.id, cartIds, availableServices)}
          />
        ))}
      </div>
    </div>
  );
};

export default ServiceGrid;
