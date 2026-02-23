import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, LayoutDashboard, RotateCcw, ListOrdered, LogOut, UserCircle, Users, CarFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import arycarLogo from '@/assets/arycar-logo.png';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetFlow, step } = useApp();
  const { user, logout } = useAuth();

  const isAdminPage = location.pathname === '/admin';
  const canManage = user?.role === 'admin';
  const canUseOps = user?.role === 'admin' || user?.role === 'employee';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={canUseOps ? '/vendedores' : '/client'} className="flex items-center gap-3" onClick={resetFlow}>
          <img src={arycarLogo} alt="ARYCAR" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight">ARYCAR</span>
        </Link>

        <nav className="flex items-center gap-2">
          {canUseOps && step !== 'plate' && !isAdminPage && (
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova OS
            </Button>
          )}

          {canUseOps && (
            <Button variant="ghost" asChild>
              <Link to="/vendedores/fila">
                <ListOrdered className="mr-2 h-4 w-4" />
                Fila
              </Link>
            </Button>
          )}

          {canUseOps && (
            <Button variant="ghost" asChild>
              <Link to="/vendedores/clientes">
                <Users className="mr-2 h-4 w-4" />
                Clientes
              </Link>
            </Button>
          )}

          {canUseOps && (
            <Button variant="ghost" asChild>
              <Link to="/vendedores/veiculos">
                <CarFront className="mr-2 h-4 w-4" />
                Veículos
              </Link>
            </Button>
          )}

          {canManage && (isAdminPage ? (
            <Button variant="ghost" asChild>
              <Link to="/vendedores">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link to="/admin">
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          ))}


          {user && (
            <Button variant="ghost" asChild>
              <Link to="/minha-conta">
                <UserCircle className="mr-2 h-4 w-4" />
                Minha conta
              </Link>
            </Button>
          )}

          {user && (
            <>
              <span className="hidden md:inline-flex text-xs text-muted-foreground items-center gap-1 px-2">
                <UserCircle className="h-4 w-4" /> {user.role}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="h-4 w-4 mr-1" /> Sair
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
