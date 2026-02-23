import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { backendApi } from '@/services/backendApi';
import { StockAlert } from '@/types';
import { toast } from 'sonner';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await backendApi.listLowStockAlerts();
      setAlerts(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar alertas de estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Alertas de estoque baixo
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadAlerts} disabled={loading}>Atualizar</Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto abaixo do estoque mínimo.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.productId} className="rounded-md border p-3 bg-amber-500/5">
                <p className="text-sm font-semibold">{alert.productName}</p>
                <p className="text-xs text-muted-foreground">
                  Atual: {alert.stockCurrent} {alert.unit} • Mínimo: {alert.stockMin} {alert.unit}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockAlerts;
