import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil } from 'lucide-react';
import { Service, SizePricing, vehicleTypeLabels } from '@/types';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { backendApi } from '@/services/backendApi';

const emptyPricing: SizePricing = { costP: 0, costM: 0, costG: 0, priceP: 0, priceM: 0, priceG: 0 };

const typeLabel = (type: string) => vehicleTypeLabels[type as keyof typeof vehicleTypeLabels] || type;

const PriceTable = () => {
  const { services, setServices } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPricing, setEditPricing] = useState<SizePricing | null>(null);
  const [editHours, setEditHours] = useState<number>(0);

  const allVehicleTypes = useMemo(
    () => Array.from(new Set(services.flatMap((service) => service.vehicleTypes || []))),
    [services],
  );

  const [activeType, setActiveType] = useState<string>('carro');

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setEditPricing({ ...(service.pricing[activeType] || emptyPricing) });
    setEditHours(service.hours);
  };

  const saveEdit = async () => {
    if (!editingId || !editPricing) return;

    const target = services.find((service) => service.id === editingId);
    if (!target) return;

    const updated: Service = {
      ...target,
      hours: editHours,
      pricing: {
        ...target.pricing,
        [activeType]: editPricing,
      },
    };

    try {
      await backendApi.updateService(updated);
      const refreshed = await backendApi.listServices();
      setServices(refreshed);
      toast.success('Preço atualizado e salvo no banco');
      setEditingId(null);
      setEditPricing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar preço.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPricing(null);
  };

  const numField = (key: keyof SizePricing) => (
    <Input
      type="number"
      className="h-7 w-20 text-xs"
      value={editPricing?.[key] ?? ''}
      onChange={(e) => setEditPricing((prev) => (prev ? { ...prev, [key]: Number(e.target.value) } : prev))}
    />
  );

  const margin = (cost: number, price: number) => {
    if (price === 0) return '-';
    return `${(((price - cost) / price) * 100).toFixed(0)}%`;
  };

  const availableTabs = allVehicleTypes.length > 0 ? allVehicleTypes : ['carro', 'moto', 'caminhao'];
  const safeActiveType = availableTabs.includes(activeType) ? activeType : availableTabs[0];

  return (
    <div>
      <Tabs value={safeActiveType} onValueChange={(v) => { setActiveType(v); cancelEdit(); }}>
        <TabsList className="mb-4 flex-wrap h-auto">
          {availableTabs.map((type) => (
            <TabsTrigger key={type} value={type}>{typeLabel(type)}</TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((type) => (
          <TabsContent key={type} value={type}>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="p-3 text-left font-semibold">Serviço</th>
                    <th className="p-2 text-center font-semibold">Gasto P</th>
                    <th className="p-2 text-center font-semibold">Gasto M</th>
                    <th className="p-2 text-center font-semibold">Gasto G</th>
                    <th className="p-2 text-center font-semibold text-primary">Preço P</th>
                    <th className="p-2 text-center font-semibold text-primary">Preço M</th>
                    <th className="p-2 text-center font-semibold text-primary">Preço G</th>
                    <th className="p-2 text-center font-semibold">Margem P</th>
                    <th className="p-2 text-center font-semibold">Prazo</th>
                    <th className="p-2 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {services.filter((service) => service.vehicleTypes.includes(type)).map((service) => {
                    const pricing = service.pricing[type] || emptyPricing;
                    return (
                      <tr key={service.id} className="border-b border-border/50 hover:bg-card/50">
                        <td className="p-3 font-medium">{service.name}</td>
                        {editingId === service.id ? (
                          <>
                            <td className="p-2 text-center">{numField('costP')}</td>
                            <td className="p-2 text-center">{numField('costM')}</td>
                            <td className="p-2 text-center">{numField('costG')}</td>
                            <td className="p-2 text-center">{numField('priceP')}</td>
                            <td className="p-2 text-center">{numField('priceM')}</td>
                            <td className="p-2 text-center">{numField('priceG')}</td>
                            <td className="p-2 text-center text-success">{margin(editPricing?.costP ?? 0, editPricing?.priceP ?? 0)}</td>
                            <td className="p-2 text-center">
                              <Input type="number" className="h-7 w-16 text-xs" value={editHours} onChange={(e) => setEditHours(Number(e.target.value))} />
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3 w-3 text-success" /></Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}><X className="h-3 w-3 text-destructive" /></Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 text-center">R$ {pricing.costP}</td>
                            <td className="p-2 text-center">R$ {pricing.costM}</td>
                            <td className="p-2 text-center">R$ {pricing.costG}</td>
                            <td className="p-2 text-center text-primary font-semibold">R$ {pricing.priceP}</td>
                            <td className="p-2 text-center text-primary font-semibold">R$ {pricing.priceM}</td>
                            <td className="p-2 text-center text-primary font-semibold">R$ {pricing.priceG}</td>
                            <td className="p-2 text-center text-success">{margin(pricing.costP, pricing.priceP)}</td>
                            <td className="p-2 text-center">{service.hours}h</td>
                            <td className="p-2 text-center">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(service)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PriceTable;
