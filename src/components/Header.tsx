import { Link, useLocation } from 'react-router-dom';
import { Settings, LayoutDashboard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

const Header = () => {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const { resetFlow, step } = useApp();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={resetFlow}>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg" style={{ fontFamily: 'Space Grotesk' }}>
              A
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              ARYCAR
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {step !== 'plate' && !isAdmin && (
            <Button variant="ghost" size="sm" onClick={resetFlow}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova OS
            </Button>
          )}
          {isAdmin ? (
            <Button variant="ghost" asChild>
              <Link to="/">
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
