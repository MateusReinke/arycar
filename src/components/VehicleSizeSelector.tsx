import { Car } from 'lucide-react';
import { VehicleSize } from '@/types';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const sizes: { key: VehicleSize; label: string; desc: string }[] = [
  { key: 'P', label: 'Pequeno', desc: 'Hatch / Sedan compacto' },
  { key: 'M', label: 'Médio', desc: 'Sedan / SUV compacto' },
  { key: 'G', label: 'Grande', desc: 'SUV / Picape / Van' },
];

const VehicleSizeSelector = () => {
  const { selectedSize, setSelectedSize } = useApp();

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">Porte do Veículo</h2>
      <div className="grid grid-cols-3 gap-3">
        {sizes.map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => setSelectedSize(key)}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
              selectedSize === key
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                : 'border-border bg-card hover:border-primary/40 hover:bg-card/80'
            )}
          >
            <Car className={cn(
              'h-8 w-8 transition-colors',
              key === 'P' && 'h-6 w-6',
              key === 'G' && 'h-10 w-10',
              selectedSize === key ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div className="text-center">
              <span className={cn(
                'text-2xl font-bold',
                selectedSize === key ? 'text-primary' : 'text-foreground'
              )}>
                {key}
              </span>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground/70">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VehicleSizeSelector;
