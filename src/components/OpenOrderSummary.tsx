import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { storageService } from '@/services/storage';
import { getOrderStatusLabel, OrderStatus, vehicleSizeLabels, vehicleTypeLabels } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ClipboardList, Edit } from 'lucide-react';
import { toast } from 'sonner';

const OpenOrderSummary = () => {
  const navigate = useNavigate();
  const { currentOpenOrder, currentCustomer, currentVehicle, setStep, resetFlow, setCurrentOpenOrder } = useApp();
  const settings = storageService.getSettings();
  const [status, setStatus] = useState<OrderStatus | ''>(currentOpenOrder?.status || '');

  const localOrder = useMemo(
    () => (currentOpenOrder ? storageService.getOrders().find((order) => order.id === currentOpenOrder.id) : undefined),
    [currentOpenOrder],
  );

  if (!currentOpenOrder || !currentCustomer || !currentVehicle) {
    return null;
  }

  const canEditLocal = Boolean(localOrder);

  const handleSaveStatus = () => {
    if (!canEditLocal || !status) {
      toast.info('Esta OS foi carregada do banco e deve ser editada na fila de OS.');
      return;
    }

    const updatedOrder = { ...localOrder, status };
    storageService.updateOrder(updatedOrder);
    setCurrentOpenOrder(updatedOrder);
    toast.success('Status da OS atualizado com sucesso.');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={resetFlow}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Resumo da OS em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <p><span className="text-muted-foreground">OS:</span> #{currentOpenOrder.id.slice(-4)}</p>
              <p><span className="text-muted-foreground">Cliente:</span> {currentCustomer.name}</p>
              <p><span className="text-muted-foreground">Placa:</span> {currentVehicle.plate}</p>
              <p><span className="text-muted-foreground">Veículo:</span> {vehicleTypeLabels[currentVehicle.type]} • Porte {vehicleSizeLabels[currentVehicle.size].label}</p>
              <p><span className="text-muted-foreground">Total:</span> R$ {currentOpenOrder.total.toFixed(2)}</p>
              <p><span className="text-muted-foreground">Aberta em:</span> {currentOpenOrder.date}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{getOrderStatusLabel(currentOpenOrder.status, settings.customStatuses)}</Badge>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Edição rápida</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
                  <SelectTrigger className="sm:w-64">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Aguardando</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="done">Finalizado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSaveStatus}>
                  <Edit className="mr-2 h-4 w-4" /> Salvar status
                </Button>
              </div>
              {!canEditLocal && (
                <p className="text-xs text-muted-foreground">
                  Para OS vindas do banco de dados, use a tela de Fila para edição completa.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => navigate('/queue')} className="flex-1">Ir para fila e editar OS</Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setCurrentOpenOrder(null);
                  setStep('services');
                }}
              >
                Continuar para nova seleção de serviços
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenOrderSummary;
