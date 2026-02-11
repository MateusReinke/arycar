import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil } from 'lucide-react';
import { Service, VehicleType, SizePricing, vehicleTypeLabels } from '@/types';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PriceTable = () => {
  const { services, setServices } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPricing, setEditPricing] = useState<SizePricing | null>(null);
  const [editHours, setEditHours] = useState<number>(0);
  const [activeType, setActiveType] = useState<VehicleType>('carro');

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditPricing({ ...s.pricing[activeType] });
    setEditHours(s.hours);
  };

  const saveEdit = () => {
    if (!editingId || !editPricing) return;
    setServices(services.map(s => {
      if (s.id !== editingId) return s;
      return {
        ...s,
        hours: editHours,
        pricing: { ...s.pricing, [activeType]: editPricing },
      };
    }));
    setEditingId(null);
    toast.success('Serviço atualizado');
  };

  const cancelEdit = () => { setEditingId(null); setEditPricing(null); };

  const numField = (key: keyof SizePricing) => (
    <Input
      type="number"
      className="h-7 w-20 text-xs"
      value={editPricing?.[key] ?? ''}
      onChange={e => setEditPricing(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)}
    />
  );

  const margin = (cost: number, price: number) => {
    if (price === 0) return '-';
    return `${(((price - cost) / price) * 100).toFixed(0)}%`;
  };

  return (
    <div>
      <Tabs value={activeType} onValueChange={v => { setActiveType(v as VehicleType); cancelEdit(); }}>
        <TabsList className="mb-4">
          {(Object.keys(vehicleTypeLabels) as VehicleType[]).map(type => (
            <TabsTrigger key={type} value={type}>{vehicleTypeLabels[type]}</TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(vehicleTypeLabels) as VehicleType[]).map(type => (
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
                  {services.filter(s => s.vehicleTypes.includes(type)).map(s => {
                    const p = s.pricing[type];
                    return (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-card/50">
                        <td className="p-3 font-medium">{s.name}</td>
                        {editingId === s.id ? (
                          <>
                            <td className="p-2 text-center">{numField('costP')}</td>
                            <td className="p-2 text-center">{numField('costM')}</td>
                            <td className="p-2 text-center">{numField('costG')}</td>
                            <td className="p-2 text-center">{numField('priceP')}</td>
                            <td className="p-2 text-center">{numField('priceM')}</td>
                            <td className="p-2 text-center">{numField('priceG')}</td>
                            <td className="p-2 text-center text-success">{margin(editPricing?.costP ?? 0, editPricing?.priceP ?? 0)}</td>
                            <td className="p-2 text-center">
                              <Input type="number" className="h-7 w-16 text-xs" value={editHours}
                                onChange={e => setEditHours(Number(e.target.value))} />
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
                            <td className="p-2 text-center">R$ {p.costP}</td>
                            <td className="p-2 text-center">R$ {p.costM}</td>
                            <td className="p-2 text-center">R$ {p.costG}</td>
                            <td className="p-2 text-center text-primary font-semibold">R$ {p.priceP}</td>
                            <td className="p-2 text-center text-primary font-semibold">R$ {p.priceM}</td>
                            <td className="p-2 text-center text-primary font-semibold">R$ {p.priceG}</td>
                            <td className="p-2 text-center text-success">{margin(p.costP, p.priceP)}</td>
                            <td className="p-2 text-center">{s.hours}h</td>
                            <td className="p-2 text-center">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}>
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
