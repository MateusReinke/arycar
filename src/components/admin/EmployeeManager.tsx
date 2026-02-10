import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Employee } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const EmployeeManager = () => {
  const { employees, setEmployees } = useApp();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nome obrigatório'); return; }
    if (editingId) {
      setEmployees(employees.map(e => e.id === editingId ? { id: editingId, name, role } : e));
      toast.success('Funcionário atualizado');
    } else {
      setEmployees([...employees, { id: Date.now().toString(), name, role }]);
      toast.success('Funcionário adicionado');
    }
    setName(''); setRole(''); setEditingId(null);
  };

  const handleEdit = (e: Employee) => {
    setEditingId(e.id); setName(e.name); setRole(e.role);
  };

  const handleDelete = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    toast.success('Funcionário removido');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input className="h-8 text-xs" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Cargo</Label>
            <Input className="h-8 text-xs" value={role} onChange={e => setRole(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {editingId ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={() => { setName(''); setRole(''); setEditingId(null); }}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold mb-2">Funcionários ({employees.length})</h3>
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum funcionário cadastrado</p>
        ) : (
          <div className="space-y-1">
            {employees.map(e => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-card p-3">
                <div>
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.role}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(e)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManager;
