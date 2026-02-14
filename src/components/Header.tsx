import { Link, useLocation } from 'react-router-dom';
import { Settings, LayoutDashboard, RotateCcw, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import arycarLogo from '@/assets/arycar-logo.png';

const Header = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const { resetFlow, step } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/app" className="flex items-center gap-3" onClick={resetFlow}>
          <img src={arycarLogo} alt="ARYCAR" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight">
            ARYCAR
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {step !== 'plate' && !isAdmin && (
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova OS
            </Button>
          )}
          <Button variant="ghost" asChild>
            <Link to="/queue">
              <ListOrdered className="mr-2 h-4 w-4" />
              Fila
            </Link>
          </Button>
          {isAdmin ? (
            <Button variant="ghost" asChild>
              <Link to="/app">
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
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
