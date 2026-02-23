import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Employee } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const defaultForm = {
  name: '',
  role: '',
  email: '',
  phone: '',
  department: '',
  shift: '',
};

const EmployeeManager = () => {
  const { employees, setEmployees } = useApp();
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome obrigatório'); return; }
    if (!form.role.trim()) { toast.error('Cargo obrigatório'); return; }

    const payload: Employee = {
      id: editingId || Date.now().toString(),
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      shift: form.shift.trim(),
    };

    if (editingId) {
      setEmployees(employees.map((e) => e.id === editingId ? payload : e));
      toast.success('Funcionário atualizado');
    } else {
      setEmployees([...employees, payload]);
      toast.success('Funcionário adicionado');
    }

    setForm(defaultForm);
    setEditingId(null);
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      role: employee.role,
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      shift: employee.shift || '',
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Cargo *</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
            <div><Label className="text-xs">E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="text-xs">Departamento</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label className="text-xs">Turno</Label><Input value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} placeholder="Ex.: Manhã" /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              {editingId ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
            {editingId && <Button variant="outline" onClick={() => { setForm(defaultForm); setEditingId(null); }}>Cancelar</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold mb-2">Funcionários ({employees.length})</h3>
        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum funcionário cadastrado</p>
        ) : (
          <div className="space-y-1">
            {employees.map((e) => (
              <div key={e.id} className="rounded-lg bg-card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.role} • {e.department || 'Sem departamento'}</p>
                    <p className="text-xs text-muted-foreground">{e.email || 'Sem e-mail'} • {e.phone || 'Sem telefone'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(e)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEmployees(employees.filter((item) => item.id !== e.id))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
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
