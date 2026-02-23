import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { backendApi } from '@/services/backendApi';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const AccountSettings = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    birthDate: '',
    emergencyContact: '',
    department: '',
    jobTitle: '',
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    backendApi.getUserProfile(user.id)
      .then((profile) => {
        setForm({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          cpf: profile.cpf || '',
          address: profile.address || '',
          birthDate: profile.birthDate ? String(profile.birthDate).slice(0, 10) : '',
          emergencyContact: profile.emergencyContact || '',
          department: profile.department || '',
          jobTitle: profile.jobTitle || '',
        });
      })
      .catch(() => toast.error('Não foi possível carregar seu perfil.'));
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const updated = await backendApi.updateUserProfile(user.id, form);
      login({ ...user, ...updated });
      toast.success('Perfil atualizado com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await backendApi.updateUserPassword(user.id, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Senha alterada com sucesso.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações da Conta</h1>

      <Card>
        <CardHeader><CardTitle>Dados pessoais e contato</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
          <div><Label>Data de nascimento</Label><Input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></div>
          <div><Label>Contato de emergência</Label><Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} /></div>
          <div><Label>Departamento</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div><Label>Cargo</Label><Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <Button onClick={saveProfile} disabled={loading} className="md:col-span-2">Salvar perfil</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alterar senha</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label>Senha atual</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div><Label>Nova senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          <Button onClick={savePassword} disabled={loading} className="md:col-span-2">Atualizar senha</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
