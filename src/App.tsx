import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import SiteBackground from '@/components/SiteBackground';
import Homepage from './pages/Homepage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/vendedores/Dashboard';
import Queue from './pages/vendedores/Queue';
import Customers from './pages/vendedores/Customers';
import Vehicles from './pages/vendedores/Vehicles';
import Admin from './pages/admin/Admin';
import CustomerPortal from './pages/client/CustomerPortal';
import NotFound from './pages/NotFound';
import AccountSettings from './pages/account/AccountSettings';
import { UserRole } from './types';

const queryClient = new QueryClient();

const destinationByRole: Record<UserRole, string> = {
  admin: '/admin',
  employee: '/vendedores',
  customer: '/client',
};

const Protected = ({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) => {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(roles)) return <Navigate to={destinationByRole[user.role]} replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SiteBackground />
            <div className="relative z-10">
              <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />

              <Route path="/app" element={<Navigate to="/vendedores" replace />} />
              <Route path="/queue" element={<Navigate to="/vendedores/fila" replace />} />
              <Route path="/customer" element={<Navigate to="/client" replace />} />

              <Route
                path="/vendedores"
                element={<Protected roles={['admin', 'employee']}><Header /><Dashboard /></Protected>}
              />
              <Route
                path="/vendedores/fila"
                element={<Protected roles={['admin', 'employee']}><Header /><Queue /></Protected>}
              />
              <Route
                path="/vendedores/clientes"
                element={<Protected roles={['admin', 'employee']}><Header /><Customers /></Protected>}
              />
              <Route
                path="/vendedores/veiculos"
                element={<Protected roles={['admin', 'employee']}><Header /><Vehicles /></Protected>}
              />
              <Route
                path="/admin"
                element={<Protected roles={['admin']}><Header /><Admin /></Protected>}
              />

              <Route
                path="/minha-conta"
                element={<Protected roles={['admin', 'employee', 'customer']}><Header /><AccountSettings /></Protected>}
              />

              <Route
                path="/client"
                element={<Protected roles={['customer']}><Header /><CustomerPortal /></Protected>}
              />

              <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
