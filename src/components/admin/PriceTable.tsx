import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil } from 'lucide-react';
import { Service } from '@/types';
import { toast } from 'sonner';

const PriceTable = () => {
  const { services, setServices } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Service>>({});

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditData({ ...s });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setServices(services.map(s => s.id === editingId ? { ...s, ...editData } as Service : s));
    setEditingId(null);
    toast.success('Serviço atualizado');
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const numField = (key: keyof Service) => (
    <Input
      type="number"
      className="h-7 w-20 text-xs"
      value={(editData as any)[key] ?? ''}
      onChange={e => setEditData(prev => ({ ...prev, [key]: Number(e.target.value) }))}
    />
  );

  const margin = (cost: number, price: number) => {
    if (price === 0) return '-';
    return `${(((price - cost) / price) * 100).toFixed(0)}%`;
  };

  return (
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
          {services.map(s => (
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
                  <td className="p-2 text-center text-success">{margin(editData.costP ?? 0, editData.priceP ?? 0)}</td>
                  <td className="p-2 text-center">{numField('hours')}</td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="h-3 w-3 text-success" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}><X className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-2 text-center">R$ {s.costP}</td>
                  <td className="p-2 text-center">R$ {s.costM}</td>
                  <td className="p-2 text-center">R$ {s.costG}</td>
                  <td className="p-2 text-center text-primary font-semibold">R$ {s.priceP}</td>
                  <td className="p-2 text-center text-primary font-semibold">R$ {s.priceM}</td>
                  <td className="p-2 text-center text-primary font-semibold">R$ {s.priceG}</td>
                  <td className="p-2 text-center text-success">{margin(s.costP, s.priceP)}</td>
                  <td className="p-2 text-center">{s.hours}h</td>
                  <td className="p-2 text-center">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PriceTable;
