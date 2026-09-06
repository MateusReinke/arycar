import { useState, useMemo } from 'react';
import { storageService } from '@/services/storage';
import {
  OrderSummary,
  OrderStatus,
  getOrderStatusLabel,
  getStatusColorClass,
  vehicleTypeLabels,
  vehicleSizeLabels,
  defaultOrderStatusLabels,
  CustomStatus,
} from '@/types';
import { useApp } from '@/context/AppContext';
import { getDisabledServiceIds, getExclusionReason } from '@/data/serviceExclusions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Clock, Car, Plus, Trash2, Edit, RefreshCw, Search } from 'lucide-react';

const Queue = () => {
  const { services, getPrice } = useApp();
  const settings = storageService.getSettings();
  const statuses: { key: string; label: string }[] = [
    ...Object.entries(defaultOrderStatusLabels).map(([key, label]) => ({ key, label })),
    ...(settings.customStatuses || []).map((item: CustomStatus) => ({ key: item.key, label: item.label })),
  ];

  const [orders, setOrders] = useState<OrderSummary[]>(() => storageService.getOrders());
  const [editingOrder, setEditingOrder] = useState<OrderSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const refresh = () => setOrders(storageService.getOrders());

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = orders
      .filter(o => statusFilter === 'all' || o.status === statusFilter)
      .filter(o => {
        if (!term) return true;
        return (
          o.vehiclePlate.toLowerCase().includes(term)
          || o.customerName.toLowerCase().includes(term)
          || o.id.slice(-4).includes(term)
        );
      });
    return [...list].reverse();
  }, [orders, statusFilter, search]);

  const updateStatus = (order: OrderSummary, status: OrderStatus) => {
    const updated = { ...order, status };
    storageService.updateOrder(updated);
    refresh();
    toast.success(`OS #${order.id.slice(-4)} → ${getOrderStatusLabel(status, settings.customStatuses)}`);
  };

  const deleteOrder = (id: string) => {
    storageService.deleteOrder(id);
    refresh();
    toast.success('OS removida');
  };

  const totalHours = (order: OrderSummary) =>
    order.items.reduce((s, i) => s + i.service.hours * i.quantity, 0);

  const totalPrice = (order: OrderSummary) =>
    order.items.reduce((s, i) => s + getPrice(i.service, i.vehicleType, i.size) * i.quantity, 0);

  const addServiceToOrder = (serviceId: string) => {
    if (!editingOrder) return;
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    const updated: OrderSummary = {
      ...editingOrder,
      items: [...editingOrder.items, { service, quantity: 1, vehicleType: editingOrder.vehicleType, size: editingOrder.size }],
    };
    updated.total = totalPrice(updated);
    storageService.updateOrder(updated);
    setEditingOrder(updated);
    refresh();
    toast.success(`${service.name} adicionado`);
  };

  const removeServiceFromOrder = (serviceId: string) => {
    if (!editingOrder) return;
    const updated: OrderSummary = {
      ...editingOrder,
      items: editingOrder.items.filter(i => i.service.id !== serviceId),
    };
    updated.total = totalPrice(updated);
    storageService.updateOrder(updated);
    setEditingOrder(updated);
    refresh();
  };

  const availableToAdd = useMemo(() => {
    if (!editingOrder) return [];
    const currentIds = editingOrder.items.map(i => i.service.id);
    const disabledIds = getDisabledServiceIds(currentIds, services);
    return services
      .filter(s => s.vehicleTypes.includes(editingOrder.vehicleType))
      .filter(s => !currentIds.includes(s.id))
      .map(s => ({
        ...s,
        disabled: disabledIds.has(s.id),
        reason: getExclusionReason(s.id, currentIds, services),
      }));
  }, [editingOrder, services]);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Fila de Serviços</h1>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar placa, cliente ou OS"
              className="pl-9"
              aria-label="Buscar ordens de serviço"
            />
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-12">Nenhuma OS encontrada.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(order => (
          <Card key={order.id} className={`relative border-2 ${getStatusColorClass(order.status, settings.customStatuses)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">OS #{order.id.slice(-4)}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{order.date}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.vehiclePlate}</span>
                <span className="text-muted-foreground">• {vehicleTypeLabels[order.vehicleType]} {vehicleSizeLabels[order.size].label}</span>
              </div>
              <p className="text-sm"><span className="text-muted-foreground">Cliente:</span> {order.customerName}</p>

              <Separator />

              <ul className="space-y-1">
                {order.items.map(item => (
                  <li key={item.service.id} className="text-sm flex justify-between">
                    <span>{item.service.name} {item.quantity > 1 && `×${item.quantity}`}</span>
                    <span className="font-medium">R$ {(getPrice(item.service, item.vehicleType, item.size) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {totalHours(order)}h estimado</span>
                <span className="font-bold">R$ {totalPrice(order).toFixed(2)}</span>
              </div>

              {order.pickupDelivery && <Badge variant="secondary" className="text-xs">Leva e Traz</Badge>}
              {order.description && <p className="text-xs text-muted-foreground">Solicitação: {order.description}</p>}

              <div className="flex gap-2 pt-2">
                <Select value={order.status} onValueChange={(v) => updateStatus(order, v as OrderStatus)}>
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setEditingOrder(order)}><Edit className="h-3.5 w-3.5" /></Button>
                <Button variant="destructive" size="sm" onClick={() => deleteOrder(order.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingOrder} onOpenChange={(o) => !o && setEditingOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar OS #{editingOrder?.id.slice(-4)}</DialogTitle>
          </DialogHeader>

          {editingOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Serviços atuais</h4>
                <ul className="space-y-2">
                  {editingOrder.items.map(item => (
                    <li key={item.service.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm">
                      <span>{item.service.name} {item.quantity > 1 && `×${item.quantity}`}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => removeServiceFromOrder(item.service.id)} disabled={editingOrder.items.length <= 1}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1"><Plus className="h-4 w-4" /> Adicionar serviço</h4>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {availableToAdd.map(s => (
                    <Button key={s.id} variant="outline" size="sm" className="justify-start text-left h-auto py-2" disabled={s.disabled} onClick={() => addServiceToOrder(s.id)}>
                      <span className="flex-1">{s.name}</span>
                      {s.disabled && s.reason && <span className="text-xs text-destructive ml-2">{s.reason}</span>}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />
              <div className="flex justify-between font-medium">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {totalHours(editingOrder)}h</span>
                <span>R$ {totalPrice(editingOrder).toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Queue;
