import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import arycarLogo from '@/assets/arycar-logo.png';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_ADMIN_EMAIL = 'admin@arycar.com.br';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Informe e-mail corporativo ou telefone.');
      return;
    }

    const clean = identifier.trim();
    const isEmail = clean.includes('@');

    if (isEmail && !password) {
      toast.error('Senha é obrigatória para acesso interno.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);

      if (isEmail) {
        const email = clean.toLowerCase();
        const role = email === DEFAULT_ADMIN_EMAIL ? 'admin' : 'employee';
        login({ name: role === 'admin' ? 'Administrador' : 'Funcionário', email, role });
        toast.success(`Login realizado como ${role === 'admin' ? 'Admin' : 'Funcionário'}.`);
        navigate('/app');
        return;
      }

      const phone = clean.replace(/\D/g, '');
      login({ name: 'Cliente', phone, role: 'customer' });
      toast.success('Login realizado como Cliente.');
      navigate('/customer');
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
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
            <CardDescription>
              Equipe: e-mail corporativo • Cliente: telefone cadastrado
            </CardDescription>
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
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="admin@arycar.com.br ou (11) 99999-9999"
                    className="pl-10"
                  />
                </div>
              </div>

              {identifier.includes('@') && (
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
