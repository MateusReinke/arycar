import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Service, VehicleType, SizePricing, vehicleTypeLabels, Product, UnitType, ServiceProductConsumption } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { backendApi } from '@/services/backendApi';

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
  active: boolean;
  averageTimeMinutes: number;
  productConsumption: ServiceProductConsumption[];
}

const emptyForm: FormData = {
  name: '',
  pricing: { carro: { ...emptyPricing }, moto: { ...emptyPricing }, caminhao: { ...emptyPricing } },
  hours: 1,
  needsScheduling: false,
  products: '', observation: '', priceRule: '', perUnit: false,
  vehicleTypes: ['carro', 'moto', 'caminhao'],
  active: true,
  averageTimeMinutes: 60,
  productConsumption: [],
};

const units: UnitType[] = ['ml', 'l', 'g', 'kg', 'un'];

const ServiceForm = () => {
  const { services, setServices } = useApp();
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingType, setPricingType] = useState<VehicleType>('carro');
  const [products, setProducts] = useState<Product[]>([]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const loadServices = useCallback(async () => {
    try {
      const remoteServices = await backendApi.listServices();
      setServices(remoteServices);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar serviços do banco.');
    }
  }, [setServices]);

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await backendApi.listProducts());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar produtos.');
    }
  }, []);

  const validateConsumption = () => {
    const seen = new Set<string>();
    for (const item of form.productConsumption) {
      if (!item.productId) {
        toast.error('Selecione o produto em todas as linhas de consumo.');
        return false;
      }
      if (seen.has(item.productId)) {
        toast.error('Não é permitido repetir o mesmo produto no consumo do serviço.');
        return false;
      }
      seen.add(item.productId);
      if (item.quantity <= 0) {
        toast.error('Quantidade de consumo deve ser maior que zero.');
        return false;
      }

      const product = productMap.get(item.productId);
      if (!product) {
        toast.error('Produto selecionado não encontrado.');
        return false;
      }

      const validPair = (
        (product.unit === item.unit)
        || (product.unit === 'ml' && item.unit === 'l')
        || (product.unit === 'l' && item.unit === 'ml')
        || (product.unit === 'g' && item.unit === 'kg')
        || (product.unit === 'kg' && item.unit === 'g')
      );

      if (!validPair) {
        toast.error(`Unidade incompatível para ${product.name}. Produto em ${product.unit} e consumo em ${item.unit}.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (form.vehicleTypes.length === 0) { toast.error('Selecione ao menos um tipo de veículo'); return; }
    if (!validateConsumption()) return;

    try {
      if (editingId) {
        await backendApi.updateService({ ...form, id: editingId });
        toast.success('Serviço atualizado');
      } else {
        await backendApi.createService({ ...form, id: Date.now().toString() });
        toast.success('Serviço adicionado');
      }

      await loadServices();
      setForm({ ...emptyForm });
      setEditingId(null);
      setPricingType('carro');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar serviço.');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    const { id, ...rest } = service;
    const clonedForm: FormData = {
      ...emptyForm,
      ...rest,
      pricing: {
        carro: { ...rest.pricing.carro },
        moto: { ...rest.pricing.moto },
        caminhao: { ...rest.pricing.caminhao },
      },
      vehicleTypes: [...rest.vehicleTypes],
      productConsumption: (rest.productConsumption || []).map((item) => ({ ...item })),
      active: rest.active ?? true,
      averageTimeMinutes: rest.averageTimeMinutes ?? 60,
    };
    setForm(clonedForm);
    setPricingType(clonedForm.vehicleTypes[0] || 'carro');
  };

  const handleDelete = async (id: string) => {
    try {
      await backendApi.deleteService(id);
      await loadServices();
      toast.success('Serviço removido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover serviço.');
    }
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

  const addConsumptionLine = () => {
    const defaultProduct = products[0];
    setForm((prev) => ({
      ...prev,
      productConsumption: [
        ...prev.productConsumption,
        {
          productId: defaultProduct?.id ?? '',
          quantity: 0,
          unit: defaultProduct?.unit ?? 'ml',
          wasteFactor: 0,
        },
      ],
    }));
  };

  const updateConsumption = (index: number, patch: Partial<ServiceProductConsumption>) => {
    setForm((prev) => {
      const next = [...prev.productConsumption];
      next[index] = { ...next[index], ...patch };
      return { ...prev, productConsumption: next };
    });
  };

  const removeConsumption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      productConsumption: prev.productConsumption.filter((_, idx) => idx !== index),
    }));
  };

  const currentPricing = form.pricing[pricingType];

  useEffect(() => {
    void loadServices();
    void loadProducts();
  }, [loadProducts, loadServices]);

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tempo médio (minutos)</Label>
              <Input
                type="number"
                className="h-8 text-xs"
                value={form.averageTimeMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, averageTimeMinutes: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch checked={form.active} onCheckedChange={(active) => setForm((prev) => ({ ...prev, active }))} />
              <Label className="text-xs">Ativo</Label>
            </div>
          </div>

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
            <div className="flex items-center justify-between">
              <Label className="text-xs">Consumo de produtos</Label>
              <Button type="button" size="sm" variant="outline" onClick={addConsumptionLine}>Adicionar produto</Button>
            </div>
            <div className="mt-2 space-y-2">
              {form.productConsumption.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum produto no consumo desta receita.</p>
              )}
              {form.productConsumption.map((consumption, index) => (
                <div key={`${consumption.productId}-${index}`} className="grid grid-cols-12 gap-2 items-end border rounded-md p-2">
                  <div className="col-span-4">
                    <Label className="text-xs">Produto</Label>
                    <select
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      value={consumption.productId}
                      onChange={(e) => {
                        const selectedProduct = productMap.get(e.target.value);
                        updateConsumption(index, {
                          productId: e.target.value,
                          unit: selectedProduct?.unit ?? consumption.unit,
                        });
                      }}
                    >
                      <option value="">Selecione</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Qtd</Label>
                    <Input className="h-8 text-xs" type="number" min="0" step="0.001" value={consumption.quantity}
                      onChange={(e) => updateConsumption(index, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unidade</Label>
                    <select
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      value={consumption.unit}
                      onChange={(e) => updateConsumption(index, { unit: e.target.value as UnitType })}
                    >
                      {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Perda %</Label>
                    <Input className="h-8 text-xs" type="number" min="0" step="0.01" value={consumption.wasteFactor * 100}
                      onChange={(e) => updateConsumption(index, { wasteFactor: Number(e.target.value) / 100 })}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeConsumption(index)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
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
                  {s.vehicleTypes.map(t => vehicleTypeLabels[t]).join(', ')} • {(s.productConsumption || []).length} produtos
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
