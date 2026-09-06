import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Service, SizePricing, vehicleTypeLabels, Product, UnitType, ServiceProductConsumption } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Car, Copy, Search, AlertTriangle, Wand2, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { backendApi } from '@/services/backendApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

const unitConversionFactor: Record<string, number> = {
  'ml->l': 1 / 1000,
  'l->ml': 1000,
  'g->kg': 1 / 1000,
  'kg->g': 1000,
};

const convertQty = (qty: number, from: UnitType, to: UnitType): number => {
  if (from === to) return qty;
  const factor = unitConversionFactor[`${from}->${to}`];
  return factor !== undefined ? qty * factor : qty;
};

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const marginPercent = (cost: number, price: number): number | null => {
  if (price <= 0) return null;
  return ((price - cost) / price) * 100;
};

const marginBadgeVariant = (margin: number | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (margin === null) return 'outline';
  if (margin < 20) return 'destructive';
  if (margin < 50) return 'secondary';
  return 'default';
};

const ServiceForm = () => {
  const { services, setServices } = useApp();
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingType, setPricingType] = useState<string>('carro');
  const [newVehicleType, setNewVehicleType] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [schedulingFilter, setSchedulingFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [displayType, setDisplayType] = useState('carro');

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

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setPricingType('carro');
    setNewVehicleType('');
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
      resetForm();
      setDialogOpen(false);
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
    setDialogOpen(true);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await backendApi.deleteService(deleteTarget.id);
      await loadServices();
      toast.success('Serviço removido');
      setDeleteTarget(null);
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

  const toggleServiceActive = async (service: Service, active: boolean) => {
    setServices(services.map((item) => (item.id === service.id ? { ...item, active } : item)));
    try {
      await backendApi.updateService({ ...service, active });
      toast.success(active ? 'Serviço ativado' : 'Serviço desativado');
    } catch (error) {
      setServices(services.map((item) => (item.id === service.id ? { ...item, active: !active } : item)));
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar serviço.');
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

  const recipeCost = useMemo(() => {
    return form.productConsumption.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      if (!product) return sum;
      const convertedQty = convertQty(item.quantity, item.unit, product.unit);
      return sum + convertedQty * (1 + (item.wasteFactor || 0)) * product.pricePerLiter;
    }, 0);
  }, [form.productConsumption, productMap]);

  const applyRecipeCostToSizes = () => {
    const rounded = Math.round(recipeCost * 100) / 100;
    setForm((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [pricingType]: { ...(prev.pricing[pricingType] || emptyPricing), costP: rounded, costM: rounded, costG: rounded },
      },
    }));
    toast.success('Custo dos produtos aplicado aos três portes. Ajuste conforme mão de obra.');
  };

  const costBelowRecipe = form.productConsumption.length > 0 && (
    currentPricing.costP < recipeCost || currentPricing.costM < recipeCost || currentPricing.costG < recipeCost
  );

  const allVehicleTypesInUse = useMemo(
    () => Array.from(new Set(services.flatMap((service) => service.vehicleTypes || []))),
    [services],
  );
  const displayOptions = allVehicleTypesInUse.length > 0 ? allVehicleTypesInUse : baseVehicleTypes;
  const safeDisplayType = displayOptions.includes(displayType) ? displayType : displayOptions[0];

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services.filter((service) => {
      if (term && !service.name.toLowerCase().includes(term)) return false;
      if (vehicleFilter !== 'all' && !service.vehicleTypes.includes(vehicleFilter)) return false;
      if (statusFilter === 'active' && service.active === false) return false;
      if (statusFilter === 'inactive' && service.active !== false) return false;
      if (schedulingFilter === 'yes' && !service.needsScheduling) return false;
      if (schedulingFilter === 'no' && service.needsScheduling) return false;
      return true;
    });
  }, [services, search, vehicleFilter, statusFilter, schedulingFilter]);

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter((s) => s.active !== false).length;
    const inactive = total - active;
    const scheduling = services.filter((s) => s.needsScheduling).length;

    const margins = services
      .map((s) => {
        const pricing = s.pricing[safeDisplayType];
        if (!pricing) return null;
        return marginPercent(pricing.costP, pricing.priceP);
      })
      .filter((value): value is number => value !== null);

    const avgMargin = margins.length > 0 ? margins.reduce((sum, m) => sum + m, 0) / margins.length : null;
    const lowMargin = margins.filter((m) => m < 20).length;

    return { total, active, inactive, scheduling, avgMargin, lowMargin };
  }, [services, safeDisplayType]);

  useEffect(() => {
    void loadServices();
    void loadProducts();
  }, [loadProducts, loadServices]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total de serviços</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.total}</p></CardContent>
        </Card>
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Ativos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.active}</p></CardContent>
        </Card>
        <Card className="border-muted-foreground/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Inativos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.inactive}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4" />Exigem agendamento</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats.scheduling}</p></CardContent>
        </Card>
        <Card className={stats.lowMargin > 0 ? 'border-red-500/40 bg-red-500/10' : ''}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Margem média ({labelForType(safeDisplayType)})</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.avgMargin !== null ? `${stats.avgMargin.toFixed(0)}%` : '-'}</p>
            {stats.lowMargin > 0 && <p className="text-xs text-red-500">{stats.lowMargin} com margem &lt; 20%</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Serviços ({filteredServices.length}/{services.length})</CardTitle>
          <Button size="sm" onClick={handleCreate}><Plus className="mr-1 h-4 w-4" /> Novo serviço</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar serviço..." className="pl-8" />
            </div>
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Veículo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {displayOptions.map((type) => <SelectItem key={type} value={type}>{labelForType(type)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={schedulingFilter} onValueChange={(value) => setSchedulingFilter(value as typeof schedulingFilter)}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Agendamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Com/sem agendar</SelectItem>
                <SelectItem value="yes">Exige agendamento</SelectItem>
                <SelectItem value="no">Sem agendamento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={safeDisplayType} onValueChange={setDisplayType}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Preços de" /></SelectTrigger>
              <SelectContent>
                {displayOptions.map((type) => <SelectItem key={type} value={type}>{labelForType(type)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 max-h-[640px] overflow-y-auto rounded-lg border border-border/60 p-2">
            {filteredServices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {services.length === 0 ? 'Nenhum serviço cadastrado.' : 'Nenhum serviço corresponde aos filtros.'}
              </p>
            ) : filteredServices.map((s) => {
              const pricing = s.pricing[safeDisplayType];
              const margin = pricing ? marginPercent(pricing.costP, pricing.priceP) : null;
              const isActive = s.active !== false;

              return (
                <div key={s.id} className={`rounded-lg bg-card p-3 ${!isActive ? 'opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium">{s.name}</p>
                        {!isActive && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                        {s.needsScheduling && <Badge variant="secondary" className="text-[10px]">Agendar</Badge>}
                        {s.perUnit && <Badge variant="secondary" className="text-[10px]">Por peça</Badge>}
                        {margin !== null && (
                          <Badge variant={marginBadgeVariant(margin)} className="text-[10px]">Margem {margin.toFixed(0)}%</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{(s.vehicleTypes || []).map(labelForType).join(', ')} • {(s.productConsumption || []).length} produtos • {s.hours}h</p>
                      <p className="text-xs text-muted-foreground">
                        {labelForType(safeDisplayType)} P/M/G: {pricing ? `${currency(pricing.priceP)} / ${currency(pricing.priceM)} / ${currency(pricing.priceG)}` : '—'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="px-1"><Switch checked={isActive} onCheckedChange={(checked) => toggleServiceActive(s, checked)} /></div>
                        </TooltipTrigger>
                        <TooltipContent>{isActive ? 'Desativar serviço' : 'Ativar serviço'}</TooltipContent>
                      </Tooltip>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(s)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteTarget(s)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
              <div>
                <Label className="text-xs">Tempo médio (min)</Label>
                <Input type="number" className="h-10 w-32 text-xs" value={form.averageTimeMinutes} onChange={(e) => setForm((prev) => ({ ...prev, averageTimeMinutes: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch checked={form.active} onCheckedChange={(active) => setForm((prev) => ({ ...prev, active }))} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 rounded-lg border border-border/60 bg-card/50 p-3">
              <Label className="text-xs font-semibold block">Tipos de veículo</Label>
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
              <Label className="text-xs font-semibold mb-2 block">Preços por porte</Label>
              <div className="flex flex-wrap gap-1 mb-3">
                {form.vehicleTypes.map((type) => (
                  <Button
                    key={type}
                    type="button"
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
                  {(['P', 'M', 'G'] as const).map((size) => {
                    const costKey = `cost${size}` as keyof SizePricing;
                    const priceKey = `price${size}` as keyof SizePricing;
                    const margin = marginPercent(currentPricing[costKey], currentPricing[priceKey]);
                    return (
                      <div key={size} className="space-y-1">
                        <Label className="text-xs">Gasto {size}</Label>
                        <Input type="number" className="h-8 text-xs" value={currentPricing[costKey]} onChange={(e) => updatePricing(costKey, Number(e.target.value))} />
                        <Label className="text-xs">Preço {size}</Label>
                        <Input type="number" className="h-8 text-xs" value={currentPricing[priceKey]} onChange={(e) => updatePricing(priceKey, Number(e.target.value))} />
                        {margin !== null && (
                          <Badge variant={marginBadgeVariant(margin)} className="text-[10px]">Margem {margin.toFixed(0)}%</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Consumo de produtos (receita)</Label>
                <Button type="button" size="sm" variant="outline" onClick={addConsumptionLine}>Adicionar produto</Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.productConsumption.length === 0 && <p className="text-xs text-muted-foreground">Sem consumo de produtos cadastrado.</p>}
                {form.productConsumption.map((consumption, index) => (
                  <div key={`${consumption.productId}-${index}`} className="grid grid-cols-10 gap-2 rounded-md border p-2">
                    <div className="col-span-3">
                      <Label className="text-xs">Produto</Label>
                      <Select value={consumption.productId} onValueChange={(value) => updateConsumption(index, { productId: value })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label className="text-xs">Qtd</Label><Input className="h-8 text-xs" type="number" min="0" step="0.001" value={consumption.quantity} onChange={(e) => updateConsumption(index, { quantity: Number(e.target.value) })} /></div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unidade</Label>
                      <Select value={consumption.unit} onValueChange={(value) => updateConsumption(index, { unit: value as UnitType })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label className="text-xs">Perda %</Label><Input className="h-8 text-xs" type="number" min="0" step="0.01" value={consumption.wasteFactor * 100} onChange={(e) => updateConsumption(index, { wasteFactor: Number(e.target.value) / 100 })} /></div>
                    <div className="col-span-1 flex items-end"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeConsumption(index)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div>
                  </div>
                ))}
              </div>

              {form.productConsumption.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Custo estimado da receita (produtos, por atendimento)</p>
                    <p className="text-sm font-semibold">{currency(recipeCost)}</p>
                    {costBelowRecipe && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> O gasto informado em algum porte está abaixo do custo real dos produtos.
                      </p>
                    )}
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={applyRecipeCostToSizes}>
                    <Wand2 className="mr-1 h-3.5 w-3.5" /> Aplicar aos 3 portes ({labelForType(pricingType)})
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label className="text-xs">Prazo (horas)</Label><Input type="number" className="h-8 text-xs" value={form.hours} onChange={(e) => setForm((prev) => ({ ...prev, hours: Number(e.target.value) }))} /></div>
              <div className="flex items-center gap-6 pt-5">
                <div className="flex items-center gap-2"><Switch checked={form.needsScheduling} onCheckedChange={(v) => setForm((prev) => ({ ...prev, needsScheduling: v }))} /><Label className="text-xs">Agendamento</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.perUnit} onCheckedChange={(v) => setForm((prev) => ({ ...prev, perUnit: v }))} /><Label className="text-xs">Por peça</Label></div>
              </div>
              <div className="sm:col-span-2"><Label className="text-xs">Produtos (descrição livre exibida ao cliente)</Label><Textarea className="text-xs" rows={2} value={form.products} onChange={(e) => setForm((prev) => ({ ...prev, products: e.target.value }))} /></div>
              <div><Label className="text-xs">Observação</Label><Input className="h-8 text-xs" value={form.observation} onChange={(e) => setForm((prev) => ({ ...prev, observation: e.target.value }))} /></div>
              <div><Label className="text-xs">Regra de preço</Label><Input className="h-8 text-xs" value={form.priceRule} onChange={(e) => setForm((prev) => ({ ...prev, priceRule: e.target.value }))} /></div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">{editingId ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}{editingId ? 'Salvar alterações' : 'Adicionar serviço'}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O serviço e sua receita de produtos serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServiceForm;
