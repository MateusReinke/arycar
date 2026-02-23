import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Service, SizePricing, vehicleTypeLabels, Product, UnitType, ServiceProductConsumption } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Car, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { backendApi } from '@/services/backendApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bike, Truck } from 'lucide-react';

const emptyPricing: SizePricing = { costP: 0, costM: 0, costG: 0, priceP: 0, priceM: 0, priceG: 0 };
const baseVehicleTypes = ['carro', 'moto', 'caminhao'];

interface FormData {
  name: string;
  pricing: Record<string, SizePricing>;
  hours: number;
  needsScheduling: boolean;
  products: string;
  observation: string;
  priceRule: string;
  perUnit: boolean;
  vehicleTypes: string[];
  active: boolean;
  averageTimeMinutes: number;
  productConsumption: ServiceProductConsumption[];
}

const emptyForm: FormData = {
  name: '',
  pricing: {
    carro: { ...emptyPricing },
    moto: { ...emptyPricing },
    caminhao: { ...emptyPricing },
  },
  hours: 1,
  needsScheduling: false,
  products: '',
  observation: '',
  priceRule: '',
  perUnit: false,
  vehicleTypes: ['carro', 'moto', 'caminhao'],
  active: true,
  averageTimeMinutes: 60,
  productConsumption: [],
};

const units: UnitType[] = ['ml', 'l', 'g', 'kg', 'un'];

const labelForType = (type: string) => vehicleTypeLabels[type as keyof typeof vehicleTypeLabels] || type;

const ServiceForm = () => {
  const { services, setServices } = useApp();
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingType, setPricingType] = useState<string>('carro');
  const [newVehicleType, setNewVehicleType] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'carro' | 'moto' | 'caminhao'>('all');

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

    const normalizedTypes = Array.from(new Set(form.vehicleTypes.map((type) => type.trim().toLowerCase()).filter(Boolean)));
    const normalizedPricing = normalizedTypes.reduce<Record<string, SizePricing>>((acc, type) => {
      acc[type] = form.pricing[type] || { ...emptyPricing };
      return acc;
    }, {});

    const payload = {
      ...form,
      vehicleTypes: normalizedTypes,
      pricing: normalizedPricing,
    };

    try {
      if (editingId) {
        await backendApi.updateService({ ...payload, id: editingId });
        toast.success('Serviço atualizado');
      } else {
        await backendApi.createService(payload);
        toast.success('Serviço adicionado');
      }

      await loadServices();
      setForm({ ...emptyForm });
      setEditingId(null);
      setPricingType('carro');
      setNewVehicleType('');
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar serviço.');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    const nextTypes = (service.vehicleTypes || []).length > 0 ? [...service.vehicleTypes] : [...baseVehicleTypes];
    const nextPricing = { ...service.pricing };

    nextTypes.forEach((type) => {
      if (!nextPricing[type]) nextPricing[type] = { ...emptyPricing };
    });

    setForm({
      ...emptyForm,
      ...service,
      pricing: nextPricing,
      vehicleTypes: nextTypes,
      productConsumption: (service.productConsumption || []).map((item) => ({ ...item })),
      active: service.active ?? true,
      averageTimeMinutes: service.averageTimeMinutes ?? 60,
    });
    setPricingType(nextTypes[0]);
  };

  const handleDelete = async (service: Service) => {
    const typedName = window.prompt(`Para excluir, digite exatamente o nome do serviço:\n${service.name}`);
    if (typedName !== service.name) {
      toast.error('Nome não confere. Serviço não removido.');
      return;
    }

    try {
      await backendApi.deleteService(service.id);
      await loadServices();
      toast.success('Serviço removido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover serviço.');
    }
  };

  const handleDuplicate = async (service: Service) => {
    try {
      const { id: _id, ...payload } = service;
      await backendApi.createService({ ...payload, name: `${service.name} (Cópia)` });
      await loadServices();
      toast.success('Serviço duplicado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao duplicar serviço.');
    }
  };

  const updatePricing = (key: keyof SizePricing, value: number) => {
    setForm((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [pricingType]: { ...(prev.pricing[pricingType] || emptyPricing), [key]: value },
      },
    }));
  };

  const toggleVehicleType = (type: string, checked: boolean) => {
    setForm((prev) => {
      const nextVehicleTypes = checked
        ? Array.from(new Set([...prev.vehicleTypes, type]))
        : prev.vehicleTypes.filter((t) => t !== type);

      const safePricingType = checked
        ? (pricingType || type)
        : (pricingType === type ? (nextVehicleTypes[0] || '') : pricingType);

      if (safePricingType !== pricingType) {
        setPricingType(safePricingType);
      }

      return {
        ...prev,
        vehicleTypes: nextVehicleTypes,
        pricing: {
          ...prev.pricing,
          [type]: prev.pricing[type] || { ...emptyPricing },
        },
      };
    });
  };

  const addVehicleType = () => {
    const normalized = newVehicleType.trim().toLowerCase();
    if (!normalized) return;
    if (form.vehicleTypes.includes(normalized)) {
      toast.error('Esse tipo já está adicionado.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      vehicleTypes: [...prev.vehicleTypes, normalized],
      pricing: { ...prev.pricing, [normalized]: prev.pricing[normalized] || { ...emptyPricing } },
    }));
    setPricingType(normalized);
    setNewVehicleType('');
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

  const currentPricing = form.pricing[pricingType] || emptyPricing;

  useEffect(() => {
    void loadServices();
    void loadProducts();
  }, [loadProducts, loadServices]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Serviços ({services.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? 'Fechar formulário' : 'Novo serviço'}
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Cadastro de Serviço'}</DialogTitle>
          </DialogHeader>

          <Card>
        <CardHeader>
          <CardTitle>Dados do serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
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

          <div className="space-y-2 rounded-lg border border-border/60 bg-card/50 p-3">
            <Label className="text-xs block">Tipos de Veículo</Label>
            <div className="flex flex-wrap gap-4">
              {form.vehicleTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.vehicleTypes.includes(type)}
                    onCheckedChange={(checked) => toggleVehicleType(type, checked === true)}
                  />
                  <span>{labelForType(type)}</span>
                </div>
              ))}
            </div>

            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                value={newVehicleType}
                onChange={(e) => setNewVehicleType(e.target.value)}
                placeholder="Adicionar tipo (ex.: lancha, jetski)"
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addVehicleType}>
                <Car className="mr-1 h-3 w-3" /> Adicionar tipo
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Preços por tipo</Label>
            <div className="flex flex-wrap gap-1 mb-3">
              {form.vehicleTypes.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={pricingType === type ? 'default' : 'outline'}
                  className="text-xs"
                  onClick={() => setPricingType(type)}
                >
                  {labelForType(type)}
                </Button>
              ))}
            </div>

            {form.vehicleTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground">Selecione ao menos um tipo de veículo para configurar preços.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Gasto P</Label><Input type="number" className="h-8 text-xs" value={currentPricing.costP} onChange={(e) => updatePricing('costP', Number(e.target.value))} /></div>
                <div><Label className="text-xs">Gasto M</Label><Input type="number" className="h-8 text-xs" value={currentPricing.costM} onChange={(e) => updatePricing('costM', Number(e.target.value))} /></div>
                <div><Label className="text-xs">Gasto G</Label><Input type="number" className="h-8 text-xs" value={currentPricing.costG} onChange={(e) => updatePricing('costG', Number(e.target.value))} /></div>
                <div><Label className="text-xs">Preço P</Label><Input type="number" className="h-8 text-xs" value={currentPricing.priceP} onChange={(e) => updatePricing('priceP', Number(e.target.value))} /></div>
                <div><Label className="text-xs">Preço M</Label><Input type="number" className="h-8 text-xs" value={currentPricing.priceM} onChange={(e) => updatePricing('priceM', Number(e.target.value))} /></div>
                <div><Label className="text-xs">Preço G</Label><Input type="number" className="h-8 text-xs" value={currentPricing.priceG} onChange={(e) => updatePricing('priceG', Number(e.target.value))} /></div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Consumo de produtos</Label>
              <Button type="button" size="sm" variant="outline" onClick={addConsumptionLine}>Adicionar produto</Button>
            </div>
            <div className="mt-2 space-y-2">
              {form.productConsumption.length === 0 && <p className="text-xs text-muted-foreground">Sem consumo de produtos cadastrado.</p>}
              {form.productConsumption.map((consumption, index) => (
                <div key={`${consumption.productId}-${index}`} className="grid grid-cols-10 gap-2 rounded-md border p-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Produto</Label>
                    <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={consumption.productId} onChange={(e) => updateConsumption(index, { productId: e.target.value })}>
                      <option value="">Selecione</option>
                      {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2"><Label className="text-xs">Qtd</Label><Input className="h-8 text-xs" type="number" min="0" step="0.001" value={consumption.quantity} onChange={(e) => updateConsumption(index, { quantity: Number(e.target.value) })} /></div>
                  <div className="col-span-2">
                    <Label className="text-xs">Unidade</Label>
                    <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={consumption.unit} onChange={(e) => updateConsumption(index, { unit: e.target.value as UnitType })}>
                      {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3"><Label className="text-xs">Perda %</Label><Input className="h-8 text-xs" type="number" min="0" step="0.01" value={consumption.wasteFactor * 100} onChange={(e) => updateConsumption(index, { wasteFactor: Number(e.target.value) / 100 })} /></div>
                  <div className="col-span-1"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeConsumption(index)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Prazo (horas)</Label>
            <Input type="number" className="h-8 text-xs" value={form.hours} onChange={(e) => setForm((prev) => ({ ...prev, hours: Number(e.target.value) }))} />
          </div>
          <div>
            <Label className="text-xs">Produtos</Label>
            <Textarea className="text-xs" rows={2} value={form.products} onChange={(e) => setForm((prev) => ({ ...prev, products: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Observação</Label>
            <Input className="h-8 text-xs" value={form.observation} onChange={(e) => setForm((prev) => ({ ...prev, observation: e.target.value }))} />
          </div>
          <div>
            <Label className="text-xs">Regra de preço</Label>
            <Input className="h-8 text-xs" value={form.priceRule} onChange={(e) => setForm((prev) => ({ ...prev, priceRule: e.target.value }))} />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><Switch checked={form.needsScheduling} onCheckedChange={(v) => setForm((prev) => ({ ...prev, needsScheduling: v }))} /><Label className="text-xs">Agendamento</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.perUnit} onCheckedChange={(v) => setForm((prev) => ({ ...prev, perUnit: v }))} /><Label className="text-xs">Por peça</Label></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">{editingId ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}{editingId ? 'Salvar' : 'Adicionar'}</Button>
            {editingId && (<Button variant="outline" onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setPricingType('carro'); setShowForm(false); }}>Cancelar</Button>)}
          </div>
        </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 py-2">
          <Button variant={vehicleFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setVehicleFilter('all')} className="rounded-full hover:scale-105 transition">Todos</Button>
          <Button variant={vehicleFilter === 'carro' ? 'default' : 'outline'} size="sm" onClick={() => setVehicleFilter('carro')} className="rounded-full hover:scale-105 transition"><Car className="mr-1 h-4 w-4" />Carro</Button>
          <Button variant={vehicleFilter === 'moto' ? 'default' : 'outline'} size="sm" onClick={() => setVehicleFilter('moto')} className="rounded-full hover:scale-105 transition"><Bike className="mr-1 h-4 w-4" />Moto</Button>
          <Button variant={vehicleFilter === 'caminhao' ? 'default' : 'outline'} size="sm" onClick={() => setVehicleFilter('caminhao')} className="rounded-full hover:scale-105 transition"><Truck className="mr-1 h-4 w-4" />Caminhão</Button>
        </div>
        <div className="space-y-1 max-h-[700px] overflow-y-auto rounded-lg border border-border/60 p-2">
          {services.filter((s) => vehicleFilter === 'all' || s.vehicleTypes.includes(vehicleFilter)).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-card p-3">
              <div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{(s.vehicleTypes || []).map(labelForType).join(', ')} • {(s.productConsumption || []).length} produtos • {s.hours}h</p>
                <p className="text-xs text-muted-foreground">
                  Carro P/M/G: R$ {s.pricing.carro?.priceP ?? 0} / {s.pricing.carro?.priceM ?? 0} / {s.pricing.carro?.priceG ?? 0}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { handleEdit(s); setShowForm(true); }}><Pencil className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(s)}><Copy className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(s)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;
