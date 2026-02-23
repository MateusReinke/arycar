import { useEffect, useMemo, useState } from 'react';
import { Package, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { backendApi } from '@/services/backendApi';
import { Product } from '@/types';
import { toast } from 'sonner';

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
          <Button variant="outline" size="sm" onClick={loadProducts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
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
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs">Atual: {product.stockCurrent} {product.unit} • Mínimo: {product.stockMin} {product.unit}</p>
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
    </div>
  );
};

export default StockManager;
