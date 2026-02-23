import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, PlusCircle, MessageCircle, Tags, Boxes } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ServiceForm from '@/components/admin/ServiceForm';
import EmployeeManager from '@/components/admin/EmployeeManager';
import StockManager from '@/components/admin/StockManager';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';

const STATUS_COLORS = [
  'bg-yellow-500/10 border-yellow-500/40',
  'bg-blue-500/10 border-blue-500/40',
  'bg-green-500/10 border-green-500/40',
  'bg-purple-500/10 border-purple-500/40',
  'bg-red-500/10 border-red-500/40',
];

const WhatsAppSettings = () => {
  const [number, setNumber] = useState(() => storageService.getSettings().whatsappNumber || '');

  const handleSave = () => {
    const current = storageService.getSettings();
    storageService.saveSettings({ ...current, whatsappNumber: number.replace(/\D/g, '') });
    toast.success('Número do WhatsApp salvo!');
  };

  const formatPhone = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageCircle className="h-5 w-5 text-success" />WhatsApp</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Número do WhatsApp (com DDD)</Label>
          <Input value={number} onChange={e => setNumber(formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
          <p className="text-xs text-muted-foreground mt-1">Este número será exibido no botão flutuante da Homepage.</p>
        </div>
        <Button onClick={handleSave}>Salvar</Button>
      </CardContent>
    </Card>
  );
};

const StatusManager = () => {
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [name, setName] = useState('');
  const [colorClass, setColorClass] = useState(STATUS_COLORS[0]);
  const [open, setOpen] = useState(false);

  const save = (next: typeof settings) => {
    setSettings(next);
    storageService.saveSettings(next);
  };

  const addStatus = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do status');
      return;
    }

    const key = name.trim().toLowerCase().replace(/\s+/g, '_');
    if (settings.customStatuses.some((item) => item.key === key)) {
      toast.error('Já existe status com este nome');
      return;
    }

    save({
      ...settings,
      customStatuses: [...settings.customStatuses, { key, label: name.trim(), colorClass }],
    });

    setName('');
    setColorClass(STATUS_COLORS[0]);
    setOpen(false);
    toast.success('Status cadastrado com sucesso');
  };

  const removeStatus = (key: string) => {
    save({
      ...settings,
      customStatuses: settings.customStatuses.filter((item) => item.key !== key),
    });
    toast.success('Status removido');
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between"><CardTitle className="text-lg flex items-center gap-2"><Tags className="h-5 w-5" />Status personalizados</CardTitle><Button size="sm" onClick={() => setOpen(true)}>Novo status</Button></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {settings.customStatuses.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum status personalizado cadastrado.</p>
          )}
          {settings.customStatuses.map((status) => (
            <div key={status.key} className={`flex items-center justify-between border rounded-md px-3 py-2 ${status.colorClass}`}>
              <span className="text-sm font-medium">{status.label}</span>
              <Button variant="destructive" size="sm" onClick={() => removeStatus(status.key)}>Remover</Button>
            </div>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo status</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <Label className="text-xs">Nome do status</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Aguardando peça" />
              </div>
              <div>
                <Label className="text-xs">Cor do card</Label>
                <select
                  value={colorClass}
                  onChange={(e) => setColorClass(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3"
                >
                  {STATUS_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={addStatus}>Adicionar status</Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const Admin = () => {
  return (
    <div className="container py-6">
      <h1 className="mb-2 text-2xl font-bold">Painel Administrativo</h1>
      <p className="mb-6 text-sm text-muted-foreground">Admin gerencia status, funcionários, serviços e configurações gerais.</p>
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="mb-4 w-full justify-start flex-wrap h-auto">
          <TabsTrigger value="services" className="gap-2"><PlusCircle className="h-4 w-4" />Serviços</TabsTrigger>
          <TabsTrigger value="employees" className="gap-2"><Users className="h-4 w-4" />Funcionários</TabsTrigger>
          <TabsTrigger value="status" className="gap-2"><Tags className="h-4 w-4" />Status</TabsTrigger>
          <TabsTrigger value="stock" className="gap-2"><Boxes className="h-4 w-4" />Estoque</TabsTrigger>
          <TabsTrigger value="settings" className="gap-2"><MessageCircle className="h-4 w-4" />Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="services"><ServiceForm /></TabsContent>
        <TabsContent value="employees"><EmployeeManager /></TabsContent>
        <TabsContent value="status"><StatusManager /></TabsContent>
        <TabsContent value="stock"><StockManager /></TabsContent>
        <TabsContent value="settings"><WhatsAppSettings /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
