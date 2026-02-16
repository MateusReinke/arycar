import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import arycarLogo from '@/assets/arycar-logo.png';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'customer') {
      if (!phone.replace(/\D/g, '')) {
        toast.error('Informe seu telefone para acessar como cliente');
        return;
      }
    } else if (!email || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }

    setLoading(true);
    try {
      const user = await backendApi.login(clean, password);
      login({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
      toast.success(`Login realizado como ${user.role}.`);
      navigate(user.role === 'customer' ? '/customer' : '/app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no login.');
    } finally {
      setLoading(false);
      login({
        name: role === 'admin' ? 'Administrador' : role === 'employee' ? 'Funcionário' : 'Cliente',
        email: role === 'customer' ? undefined : email,
        phone: role === 'customer' ? phone.replace(/\D/g, '') : undefined,
        role,
      });
      toast.success('Login realizado com sucesso!');
      navigate(role === 'customer' ? '/customer' : '/app');
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>

          <div className="flex justify-center">
            <img src={arycarLogo} alt="ARYCAR" className="h-16 w-auto" />
          </div>

          <h1 className="text-2xl font-bold">ARYCAR</h1>
          <p className="text-sm text-muted-foreground">Acesso por perfil</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Admin: gestão | Funcionário: criar/ver OS | Cliente: status e solicitação</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Perfil</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'customer' ? (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs">Telefone</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="pl-10"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">E-mail</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="admin@arycar.com.br"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
