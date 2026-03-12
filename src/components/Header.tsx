import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, LayoutDashboard, RotateCcw, ListOrdered, LogOut, UserCircle, Users, CarFront, Menu, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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

  const navItems = [
    canUseOps && { to: '/vendedores/fila', label: 'Fila', icon: ListOrdered },
    canUseOps && { to: '/vendedores/clientes', label: 'Clientes', icon: Users },
    canUseOps && { to: '/vendedores/veiculos', label: 'Veículos', icon: CarFront },
    canManage && (isAdminPage
      ? { to: '/vendedores', label: 'Dashboard', icon: LayoutDashboard }
      : { to: '/admin', label: 'Admin', icon: Settings }),
    user && { to: '/minha-conta', label: 'Minha conta', icon: UserCircle },
  ].filter(Boolean) as { to: string; label: string; icon: LucideIcon }[];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to={canUseOps ? '/vendedores' : '/client'} className="flex items-center gap-3" onClick={resetFlow}>
          <img src={arycarLogo} alt="ARYCAR" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight">ARYCAR</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {canUseOps && step !== 'plate' && !isAdminPage && (
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova OS
            </Button>
          )}

          {navItems.map((item) => (
            <Button key={item.to} variant={location.pathname === item.to ? 'secondary' : 'ghost'} asChild>
              <Link to={item.to}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}

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

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu lateral">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-2">
                {canUseOps && step !== 'plate' && !isAdminPage && (
                  <Button variant="secondary" className="w-full justify-start" onClick={resetFlow}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Nova OS
                  </Button>
                )}

                {navItems.map((item) => (
                  <Button key={item.to} variant={location.pathname === item.to ? 'secondary' : 'ghost'} className="w-full justify-start" asChild>
                    <Link to={item.to}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                ))}

                {user && (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    Perfil atual: <span className="font-semibold text-foreground">{user.role}</span>
                  </div>
                )}

                {user && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
