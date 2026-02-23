import { useEffect, useMemo, useState } from 'react';
import { Package, RefreshCw, TrendingDown, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { backendApi } from '@/services/backendApi';
import { Product } from '@/types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const getLevel = (product: Product) => {
  if (product.stockCurrent <= product.stockMin) return 'critical';
  if (product.stockCurrent <= product.stockMin * 1.5) return 'warning';
  return 'healthy';
};

const levelStyles: Record<string, string> = {
  critical: 'border-red-500/40 bg-red-500/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
  healthy: 'border-emerald-500/40 bg-emerald-500/10',
};

const StockManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({
    productType: '',
    brand: '',
    name: '',
    unit: 'l',
    stockCurrent: 0,
    stockMin: 0,
    pricePerLiter: 0,
    active: true,
  });

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

  useEffect(() => {
    void loadProducts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ productType: '', brand: '', name: '', unit: 'l', stockCurrent: 0, stockMin: 0, pricePerLiter: 0, active: true });
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

  const deleteProduct = async (product: Product) => {
    const typedName = window.prompt(`Para excluir, digite exatamente o nome do produto:\n${product.name}`);
    if (typedName !== product.name) {
      toast.error('Nome não confere. Produto não removido.');
      return;
    }

    try {
      await backendApi.deleteProduct(product.id);
      toast.success('Produto removido');
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover produto.');
    }
  };

  const summary = useMemo(() => {
    const critical = products.filter((product) => getLevel(product) === 'critical').length;
    const warning = products.filter((product) => getLevel(product) === 'warning').length;
    const healthy = products.filter((product) => getLevel(product) === 'healthy').length;

    return { critical, warning, healthy, total: products.length };
  }, [products]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
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
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Estoque</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Novo produto</Button>
            <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          ) : products.map((product) => {
            const level = getLevel(product);
            const percent = product.stockMin > 0 ? Math.min(100, (product.stockCurrent / product.stockMin) * 100) : 100;

            return (
              <div key={product.id} className={`rounded-lg border p-3 ${levelStyles[level]}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{product.productType} • {product.brand} • {product.name}</p>
                  <p className="text-xs">Qtd: {product.stockCurrent} {product.unit} • Mínimo: {product.stockMin} {product.unit} • Preço/litro: R$ {product.pricePerLiter.toFixed(2)}</p>
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
              <select className="h-10 w-full rounded-md border bg-background px-3" value={form.unit} onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value as Product['unit'] }))}>
                <option value="ml">ml</option><option value="l">l</option><option value="g">g</option><option value="kg">kg</option><option value="un">un</option>
              </select>
            </div>
            <div><Label className="text-xs">Quantidade</Label><Input type="number" value={form.stockCurrent} onChange={(e) => setForm((prev) => ({ ...prev, stockCurrent: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Mínimo</Label><Input type="number" value={form.stockMin} onChange={(e) => setForm((prev) => ({ ...prev, stockMin: Number(e.target.value) }))} /></div>
            <div><Label className="text-xs">Preço/litro</Label><Input type="number" value={form.pricePerLiter} onChange={(e) => setForm((prev) => ({ ...prev, pricePerLiter: Number(e.target.value) }))} /></div>
          </div>
          <Button onClick={saveProduct}>{editingId ? 'Salvar alterações' : 'Criar produto'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManager;
