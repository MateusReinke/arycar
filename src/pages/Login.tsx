import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import arycarLogo from '@/assets/arycar-logo.png';
import { backendApi } from '@/services/backendApi';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailIdentifier = identifier.includes('@');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      toast.error('Informe e-mail corporativo ou telefone.');
      return;
    }

    if (isEmailIdentifier && !password) {
      toast.error('Senha é obrigatória para acesso interno.');
      return;
    }

    setLoading(true);

    try {
      const user = await backendApi.login(cleanIdentifier, password);

      login({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });

      setTimeout(() => {
        toast.success(`Login realizado como ${user.role}.`);
        navigate(user.role === 'customer' ? '/customer' : '/app');
      }, 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha no login.');
    } finally {
      setLoading(false);
    }
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
          <p className="text-sm text-muted-foreground">Acesso automático por cadastro/papel</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Entrar</CardTitle>
            <CardDescription>Equipe: e-mail corporativo • Cliente: telefone cadastrado</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-xs">E-mail ou Telefone</Label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="admin@arycar.com.br ou (11) 99999-9999"
                    className="pl-10"
                  />
                </div>
              </div>

              {isEmailIdentifier && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs">Senha</Label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="pl-10"
                    />
                  </div>
                </div>
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
