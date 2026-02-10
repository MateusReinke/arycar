import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, Users, PlusCircle } from 'lucide-react';
import PriceTable from '@/components/admin/PriceTable';
import ServiceForm from '@/components/admin/ServiceForm';
import EmployeeManager from '@/components/admin/EmployeeManager';

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
        </TabsList>
        <TabsContent value="prices"><PriceTable /></TabsContent>
        <TabsContent value="services"><ServiceForm /></TabsContent>
        <TabsContent value="employees"><EmployeeManager /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
