import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Service, VehicleType, SizePricing, vehicleTypeLabels } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyPricing: SizePricing = { costP: 0, costM: 0, costG: 0, priceP: 0, priceM: 0, priceG: 0 };

interface FormData {
  name: string;
  pricing: Record<VehicleType, SizePricing>;
  hours: number;
  needsScheduling: boolean;
  products: string;
  observation: string;
  priceRule: string;
  perUnit: boolean;
  vehicleTypes: VehicleType[];
}

const emptyForm: FormData = {
  name: '',
  pricing: { carro: { ...emptyPricing }, moto: { ...emptyPricing }, caminhao: { ...emptyPricing } },
  hours: 1,
  needsScheduling: false,
  products: '', observation: '', priceRule: '', perUnit: false,
  vehicleTypes: ['carro', 'moto', 'caminhao'],
};

const ServiceForm = () => {
  const { services, setServices } = useApp();
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingType, setPricingType] = useState<VehicleType>('carro');

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (form.vehicleTypes.length === 0) { toast.error('Selecione ao menos um tipo de veículo'); return; }

    if (editingId) {
      setServices(services.map(s => s.id === editingId ? { ...form, id: editingId } : s));
      toast.success('Serviço atualizado');
    } else {
      setServices([...services, { ...form, id: Date.now().toString() }]);
      toast.success('Serviço adicionado');
    }
    setForm({ ...emptyForm });
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

  const updatePricing = (key: keyof SizePricing, value: number) => {
    setForm(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [pricingType]: { ...prev.pricing[pricingType], [key]: value },
      },
    }));
  };

  const toggleVehicleType = (type: VehicleType) => {
    setForm(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  const currentPricing = form.pricing[pricingType];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>

          {/* Vehicle Types */}
          <div>
            <Label className="text-xs mb-2 block">Tipos de Veículo</Label>
            <div className="flex gap-4">
              {(Object.keys(vehicleTypeLabels) as VehicleType[]).map(type => (
                <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.vehicleTypes.includes(type)}
                    onCheckedChange={() => toggleVehicleType(type)}
                  />
                  {vehicleTypeLabels[type]}
                </label>
              ))}
            </div>
          </div>

          {/* Pricing per vehicle type */}
          <div>
            <Label className="text-xs mb-2 block">Preços por tipo</Label>
            <div className="flex gap-1 mb-3">
              {(Object.keys(vehicleTypeLabels) as VehicleType[]).map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant={pricingType === type ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setPricingType(type)}
                >
                  {vehicleTypeLabels[type]}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Gasto P</Label>
                <Input type="number" className="h-8 text-xs" value={currentPricing.costP}
                  onChange={e => updatePricing('costP', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Gasto M</Label>
                <Input type="number" className="h-8 text-xs" value={currentPricing.costM}
                  onChange={e => updatePricing('costM', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Gasto G</Label>
                <Input type="number" className="h-8 text-xs" value={currentPricing.costG}
                  onChange={e => updatePricing('costG', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Preço P</Label>
                <Input type="number" className="h-8 text-xs" value={currentPricing.priceP}
                  onChange={e => updatePricing('priceP', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Preço M</Label>
                <Input type="number" className="h-8 text-xs" value={currentPricing.priceM}
                  onChange={e => updatePricing('priceM', Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-xs">Preço G</Label>
                <Input type="number" className="h-8 text-xs" value={currentPricing.priceG}
                  onChange={e => updatePricing('priceG', Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Prazo (horas)</Label>
            <Input type="number" className="h-8 text-xs" value={form.hours}
              onChange={e => setForm(prev => ({ ...prev, hours: Number(e.target.value) }))} />
          </div>
          <div>
            <Label className="text-xs">Produtos</Label>
            <Textarea className="text-xs" rows={2} value={form.products}
              onChange={e => setForm(prev => ({ ...prev, products: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Observação</Label>
            <Input className="h-8 text-xs" value={form.observation}
              onChange={e => setForm(prev => ({ ...prev, observation: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Regra de preço</Label>
            <Input className="h-8 text-xs" value={form.priceRule}
              onChange={e => setForm(prev => ({ ...prev, priceRule: e.target.value }))} />
          </div>
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
              <Button variant="outline" onClick={() => { setForm({ ...emptyForm }); setEditingId(null); }}>
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
                <p className="text-xs text-muted-foreground">
                  {s.vehicleTypes.map(t => vehicleTypeLabels[t]).join(', ')}
                </p>
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
