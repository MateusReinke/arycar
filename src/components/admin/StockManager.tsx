import { useEffect, useMemo, useState } from 'react';
import {
  Package, RefreshCw, TrendingDown, TrendingUp, Plus, Pencil, Trash2,
  Search, Wallet, ArrowUpCircle, ArrowDownCircle, History, Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { backendApi } from '@/services/backendApi';
import { Product, StockMovement } from '@/types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type StockLevel = 'critical' | 'warning' | 'healthy';

const getLevel = (product: Product): StockLevel => {
  if (product.stockCurrent <= product.stockMin) return 'critical';
  if (product.stockCurrent <= product.stockMin * 1.5) return 'warning';
  return 'healthy';
};

const levelStyles: Record<StockLevel, string> = {
  critical: 'border-red-500/40 bg-red-500/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
  healthy: 'border-emerald-500/40 bg-emerald-500/10',
};

const levelLabel: Record<StockLevel, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  healthy: 'Saudável',
};

const levelBadgeVariant: Record<StockLevel, 'destructive' | 'secondary' | 'default'> = {
  critical: 'destructive',
  warning: 'secondary',
  healthy: 'default',
};

const emptyForm: Omit<Product, 'id' | 'usedInServices'> = {
  productType: '',
  brand: '',
  name: '',
  unit: 'l',
  stockCurrent: 0,
  stockMin: 0,
  pricePerLiter: 0,
  active: true,
};

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const movementLabel: Record<string, string> = {
  manual_in: 'Entrada manual',
  manual_out: 'Saída manual',
  service_consumption: 'Consumo em serviço',
};

const StockManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id' | 'usedInServices'>>({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState<'all' | StockLevel>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [adjustProductId, setAdjustProductId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await backendApi.listProducts();
      setProducts(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    setLoadingMovements(true);
    try {
      setMovements(await backendApi.listStockMovements(20));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar movimentações.');
    } finally {
      setLoadingMovements(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    void loadMovements();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      productType: product.productType,
      brand: product.brand,
      name: product.name,
      unit: product.unit,
      stockCurrent: Number(product.stockCurrent),
      stockMin: Number(product.stockMin),
      pricePerLiter: Number(product.pricePerLiter),
      active: product.active,
    });
    setModalOpen(true);
  };

  const saveProduct = async () => {
    if (!form.productType.trim() || !form.brand.trim() || !form.name.trim()) {
      toast.error('Preencha produto, marca e nome.');
      return;
    }
    try {
      if (editingId) {
        await backendApi.updateProduct({ ...form, id: editingId });
        toast.success('Produto atualizado');
      } else {
        await backendApi.createProduct(form);
        toast.success('Produto criado');
      }
      setModalOpen(false);
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar produto.');
    }
  };

  const toggleActive = async (product: Product, active: boolean) => {
    setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, active } : item)));
    try {
      await backendApi.updateProduct({ ...product, active });
      toast.success(active ? 'Produto ativado' : 'Produto desativado');
    } catch (error) {
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, active: !active } : item)));
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar produto.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await backendApi.deleteProduct(deleteTarget.id);
      toast.success('Produto removido');
      setDeleteTarget(null);
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover produto.');
    }
  };

  const openAdjust = (product: Product) => {
    setAdjustProductId(product.id);
    setAdjustQty('');
    setAdjustReason('');
  };

  const submitAdjust = async (sign: 1 | -1) => {
    const product = products.find((item) => item.id === adjustProductId);
    if (!product) return;
    const qty = Number(adjustQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida.');
      return;
    }

    setAdjusting(true);
    try {
      await backendApi.adjustProductStock(product.id, qty * sign, adjustReason);
      toast.success(sign > 0 ? 'Entrada registrada' : 'Saída registrada');
      setAdjustProductId(null);
      setAdjustQty('');
      setAdjustReason('');
      await Promise.all([loadProducts(), loadMovements()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao movimentar estoque.');
    } finally {
      setAdjusting(false);
    }
  };

  const productTypes = useMemo(
    () => Array.from(new Set(products.map((product) => product.productType).filter(Boolean))).sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (term) {
        const haystack = `${product.productType} ${product.brand} ${product.name}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (typeFilter !== 'all' && product.productType !== typeFilter) return false;
      if (levelFilter !== 'all' && getLevel(product) !== levelFilter) return false;
      if (statusFilter === 'active' && !product.active) return false;
      if (statusFilter === 'inactive' && product.active) return false;
      return true;
    });
  }, [products, search, typeFilter, levelFilter, statusFilter]);

  const summary = useMemo(() => {
    const critical = products.filter((product) => getLevel(product) === 'critical').length;
    const warning = products.filter((product) => getLevel(product) === 'warning').length;
    const healthy = products.filter((product) => getLevel(product) === 'healthy').length;
    const totalValue = products.reduce((sum, product) => sum + product.stockCurrent * product.pricePerLiter, 0);

    return { critical, warning, healthy, total: products.length, totalValue };
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Saudável</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.healthy}</p></CardContent>
        </Card>
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" />Atenção</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.warning}</p></CardContent>
        </Card>
        <Card className="border-red-500/40 bg-red-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4" />Crítico</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.critical}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total de produtos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />Valor em estoque</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{currency(summary.totalValue)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Estoque</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo produto</Button>
            <Button variant="outline" size="sm" onClick={() => { void loadProducts(); void loadMovements(); }} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, marca ou tipo..."
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {productTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(value) => setLevelFilter(value as typeof levelFilter)}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Nível" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="healthy">Saudável</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Ativos e inativos</SelectItem>
                <SelectItem value="active">Somente ativos</SelectItem>
                <SelectItem value="inactive">Somente inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {products.length === 0 ? 'Nenhum produto encontrado.' : 'Nenhum produto corresponde aos filtros.'}
            </p>
          ) : filteredProducts.map((product) => {
            const level = getLevel(product);
            const percent = product.stockMin > 0 ? Math.min(100, (product.stockCurrent / product.stockMin) * 100) : 100;
            const usedInServices = product.usedInServices ?? 0;

            return (
              <div key={product.id} className={`rounded-lg border p-3 ${levelStyles[level]} ${!product.active ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{product.productType} • {product.brand} • {product.name}</p>
                      <Badge variant={levelBadgeVariant[level]} className="shrink-0">{levelLabel[level]}</Badge>
                      {!product.active && <Badge variant="outline" className="shrink-0">Inativo</Badge>}
                      {usedInServices > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="shrink-0 gap-1"><Link2 className="h-3 w-3" />{usedInServices}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>Usado em {usedInServices} serviço(s)</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Qtd: {product.stockCurrent} {product.unit} • Mínimo: {product.stockMin} {product.unit} • Preço unit.: {currency(product.pricePerLiter)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Popover open={adjustProductId === product.id} onOpenChange={(open) => (open ? openAdjust(product) : setAdjustProductId(null))}>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Movimentar estoque">
                          <History className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 space-y-2">
                        <p className="text-sm font-medium">Movimentar: {product.name}</p>
                        <Input
                          type="number" min="0" step="0.001" placeholder={`Quantidade (${product.unit})`}
                          value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                        />
                        <Textarea rows={2} placeholder="Motivo (opcional)" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" disabled={adjusting} onClick={() => submitAdjust(1)}>
                            <ArrowUpCircle className="mr-1 h-3.5 w-3.5" /> Entrada
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" disabled={adjusting} onClick={() => submitAdjust(-1)}>
                            <ArrowDownCircle className="mr-1 h-3.5 w-3.5" /> Saída
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-1">
                          <Switch checked={product.active} onCheckedChange={(checked) => toggleActive(product, checked)} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{product.active ? 'Desativar produto' : 'Ativar produto'}</TooltipContent>
                    </Tooltip>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(product)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            disabled={usedInServices > 0}
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {usedInServices > 0 && <TooltipContent>Em uso por serviços — remova a vinculação antes de excluir</TooltipContent>}
                    </Tooltip>
                  </div>
                </div>
                <div className="mt-2 h-2 rounded-full bg-background/70">
                  <div
                    className={`h-2 rounded-full ${level === 'critical' ? 'bg-red-500' : level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(8, percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" />Movimentações recentes</CardTitle>
          <Button variant="outline" size="sm" onClick={loadMovements} disabled={loadingMovements}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingMovements ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>
          ) : (
            <div className="space-y-1.5">
              {movements.map((movement) => {
                const isIn = movement.movementType === 'manual_in';
                const isOut = movement.movementType === 'manual_out';
                return (
                  <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      {isIn && <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />}
                      {isOut && <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />}
                      {!isIn && !isOut && <History className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="font-medium">{movement.productName}</span>
                      <span className="text-muted-foreground">{movementLabel[movement.movementType] || movement.movementType}</span>
                      {movement.details?.reason && <span className="italic text-muted-foreground">"{String(movement.details.reason)}"</span>}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{movement.qty} {movement.unit} ({movement.stockBefore} → {movement.stockAfter})</span>
                      <span>{movement.createdAt ? new Date(movement.createdAt).toLocaleString('pt-BR') : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label className="text-xs">Produto</Label><Input value={form.productType} onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value }))} /></div>
            <div><Label className="text-xs">Marca</Label><Input value={form.brand} onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))} /></div>
            <div className="sm:col-span-2"><Label className="text-xs">Nome</Label><Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={form.unit} onValueChange={(value) => setForm((prev) => ({ ...prev, unit: value as Product['unit'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Quantidade em estoque</Label><Input type="number" value={form.stockCurrent} onChange={(e) => setForm((prev) => ({ ...prev, stockCurrent: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Estoque mínimo</Label><Input type="number" value={form.stockMin} onChange={(e) => setForm((prev) => ({ ...prev, stockMin: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Preço por unidade</Label><Input type="number" value={form.pricePerLiter} onChange={(e) => setForm((prev) => ({ ...prev, pricePerLiter: Number(e.target.value) }))} /></div>
            <div className="flex items-center gap-2 pt-5">
              <Switch checked={form.active} onCheckedChange={(active) => setForm((prev) => ({ ...prev, active }))} />
              <Label className="text-xs">Produto ativo</Label>
            </div>
          </div>
          <Button onClick={saveProduct}>{editingId ? 'Salvar alterações' : 'Criar produto'}</Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente do estoque.
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

export default StockManager;
