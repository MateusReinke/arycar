import { ShoppingCart, Trash2, FileText, X, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { vehicleTypeLabels } from '@/types';

const Cart = () => {
  const {
    cart, cartTotal, getPrice, removeFromCart, clearCart, finalizeOrder,
    currentCustomer, currentVehicle, pickupDelivery, setPickupDelivery,
  } = useApp();
  const [open, setOpen] = useState(false);

  const handleFinalize = () => {
    const order = finalizeOrder();
    if (order) {
      toast.success(`OS #${order.id} gerada com sucesso!`, {
        description: `Total: R$ ${order.total.toFixed(2)} | ${order.customerName}`,
      });
      setOpen(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.length > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
            {cart.length}
          </Badge>
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-80 border-l border-border bg-background p-4 shadow-2xl transition-transform duration-300
        lg:static lg:block lg:shadow-none lg:translate-x-0 lg:border-l lg:z-auto
        ${open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Ordem de Serviço
          </h2>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Customer/Vehicle Info */}
        {currentCustomer && currentVehicle && (
          <div className="mb-4 rounded-lg bg-card p-3 space-y-1 text-xs">
            <p className="font-semibold text-sm">{currentCustomer.name}</p>
            <p className="text-muted-foreground">CPF: {currentCustomer.cpf}</p>
            <p className="text-muted-foreground">
              {vehicleTypeLabels[currentVehicle.type]} | {currentVehicle.brand} {currentVehicle.model} | {currentVehicle.plate}
            </p>
            {currentCustomer.address && (
              <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                <Switch
                  id="pickup"
                  checked={pickupDelivery}
                  onCheckedChange={setPickupDelivery}
                />
                <Label htmlFor="pickup" className="text-xs flex items-center gap-1 cursor-pointer">
                  <MapPin className="h-3 w-3" />
                  Leva e Traz
                </Label>
              </div>
            )}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço adicionado</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
            {cart.map(item => (
              <div key={item.service.id} className="flex items-center justify-between rounded-lg bg-card p-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.service.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}
                    R$ {(getPrice(item.service, item.vehicleType, item.size) * item.quantity).toFixed(0)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                  onClick={() => removeFromCart(item.service.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {cart.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={clearCart}>
                Limpar
              </Button>
              <Button size="sm" className="flex-1" onClick={handleFinalize}>
                <FileText className="mr-1 h-4 w-4" />
                Gerar OS
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  );
};

export default Cart;
