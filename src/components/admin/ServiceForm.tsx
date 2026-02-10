import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Service } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyService: Omit<Service, 'id'> = {
  name: '', costP: 0, costM: 0, costG: 0,
  priceP: 0, priceM: 0, priceG: 0,
  hours: 1, needsScheduling: false,
  products: '', observation: '', priceRule: '', perUnit: false,
};

const ServiceForm = () => {
  const { services, setServices } = useApp();
  const [form, setForm] = useState<Omit<Service, 'id'>>(emptyService);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (editingId) {
      setServices(services.map(s => s.id === editingId ? { ...form, id: editingId } : s));
      toast.success('Serviço atualizado');
    } else {
      setServices([...services, { ...form, id: Date.now().toString() }]);
      toast.success('Serviço adicionado');
    }
    setForm(emptyService);
    setEditingId(null);
  };

  const handleEdit = (s: Service) => {
    setEditingId(s.id);
    const { id, ...rest } = s;
    setForm(rest);
  };

  const handleDelete = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    toast.success('Serviço removido');
  };

  const field = (label: string, key: keyof Omit<Service, 'id'>, type: 'text' | 'number' = 'text') => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        className="h-8 text-xs"
        value={(form as any)[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
      />
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {field('Nome', 'name')}
          <div className="grid grid-cols-3 gap-2">
            {field('Gasto P', 'costP', 'number')}
            {field('Gasto M', 'costM', 'number')}
            {field('Gasto G', 'costG', 'number')}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {field('Preço P', 'priceP', 'number')}
            {field('Preço M', 'priceM', 'number')}
            {field('Preço G', 'priceG', 'number')}
          </div>
          {field('Prazo (horas)', 'hours', 'number')}
          <div>
            <Label className="text-xs">Produtos</Label>
            <Textarea className="text-xs" rows={2} value={form.products}
              onChange={e => setForm(prev => ({ ...prev, products: e.target.value }))} />
          </div>
          {field('Observação', 'observation')}
          {field('Regra de preço', 'priceRule')}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.needsScheduling}
                onCheckedChange={v => setForm(prev => ({ ...prev, needsScheduling: v }))} />
              <Label className="text-xs">Agendamento</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.perUnit}
                onCheckedChange={v => setForm(prev => ({ ...prev, perUnit: v }))} />
              <Label className="text-xs">Por peça</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {editingId ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => { setForm(emptyService); setEditingId(null); }}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold mb-2">Serviços cadastrados ({services.length})</h3>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {services.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-card p-3">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">P: R${s.priceP} | M: R${s.priceM} | G: R${s.priceG}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(s)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
