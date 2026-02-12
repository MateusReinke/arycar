import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, Users, PlusCircle, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PriceTable from '@/components/admin/PriceTable';
import ServiceForm from '@/components/admin/ServiceForm';
import EmployeeManager from '@/components/admin/EmployeeManager';
import { storageService } from '@/services/storage';
import { toast } from 'sonner';

const WhatsAppSettings = () => {
  const [number, setNumber] = useState(() => storageService.getSettings().whatsappNumber || '');

  const handleSave = () => {
    storageService.saveSettings({ whatsappNumber: number.replace(/\D/g, '') });
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
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-success" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Número do WhatsApp (com DDD)</Label>
          <Input
            value={number}
            onChange={e => setNumber(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Este número será exibido no botão flutuante da Homepage.
          </p>
        </div>
        <Button onClick={handleSave}>Salvar</Button>
      </CardContent>
    </Card>
  );
};

const Admin = () => {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-2xl font-bold">Painel Administrativo</h1>
      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="prices" className="gap-2">
            <Table className="h-4 w-4" />
            Tabela de Preços
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Cadastro de Serviços
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>
        <TabsContent value="prices"><PriceTable /></TabsContent>
        <TabsContent value="services"><ServiceForm /></TabsContent>
        <TabsContent value="employees"><EmployeeManager /></TabsContent>
        <TabsContent value="settings"><WhatsAppSettings /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
