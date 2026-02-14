import { Clock, CalendarCheck, Plus, Minus, Info, Ban } from 'lucide-react';
import { Service } from '@/types';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  service: Service;
  disabled?: boolean;
  disabledReason?: string | null;
}

const ServiceCard = ({ service, disabled, disabledReason }: Props) => {
  const { currentVehicle, addToCart, cart, removeFromCart, updateCartQuantity, getPrice } = useApp();
  const inCart = cart.find(i => i.service.id === service.id);

  if (!currentVehicle) return null;

  const price = getPrice(service, currentVehicle.type, currentVehicle.size);

  return (
    <div className={cn(
      'glass-card group relative flex flex-col rounded-xl p-4 transition-all duration-200',
      inCart && 'ring-2 ring-primary/50',
      disabled && 'opacity-50 pointer-events-none'
    )}>
      {disabled && disabledReason && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
          <Badge variant="destructive" className="gap-1 text-xs">
            <Ban className="h-3 w-3" />
            {disabledReason}
          </Badge>
        </div>
      )}

      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-semibold leading-tight">{service.name}</h3>
        {service.observation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 shrink-0 text-warning" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">{service.observation}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{service.hours}h</span>
        {service.needsScheduling && (
          <Badge variant="outline" className="ml-auto border-warning/30 text-warning text-[10px] px-1.5 py-0">
            <CalendarCheck className="mr-1 h-3 w-3" />
            Agendar
          </Badge>
        )}
      </div>

      {service.perUnit && (
        <Badge variant="secondary" className="mb-2 w-fit text-[10px]">Por peça</Badge>
      )}

      <div className="mt-auto">
        {price > 0 ? (
          <p className="mb-3 text-xl font-bold text-primary">
            R$ {price.toFixed(0)}
            {service.perUnit && <span className="text-xs font-normal text-muted-foreground">/un</span>}
          </p>
        ) : service.priceRule ? (
          <p className="mb-3 text-xs text-warning font-medium">{service.priceRule}</p>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">Consultar</p>
        )}

        {inCart ? (
          <div className="flex items-center gap-2">
            {service.perUnit ? (
              <>
                <Button size="icon" variant="outline" className="h-8 w-8"
                  onClick={() => {
                    if (inCart.quantity <= 1) removeFromCart(service.id);
                    else updateCartQuantity(service.id, inCart.quantity - 1);
                  }}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-semibold">{inCart.quantity}</span>
                <Button size="icon" variant="outline" className="h-8 w-8"
                  onClick={() => updateCartQuantity(service.id, inCart.quantity + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            ) : null}
            <Button size="sm" variant="destructive" className="ml-auto text-xs"
              onClick={() => removeFromCart(service.id)}>
              Remover
            </Button>
          </div>
        ) : (
          <Button size="sm" className="w-full text-xs"
            onClick={() => addToCart(service)}
            disabled={disabled || (price === 0 && !service.priceRule)}>
            <Plus className="mr-1 h-3 w-3" />
            Adicionar
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
