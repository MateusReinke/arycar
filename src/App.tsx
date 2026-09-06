import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Homepage from './pages/Homepage';
import { UserRole } from './types';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Dashboard = lazy(() => import('./pages/vendedores/Dashboard'));
const Queue = lazy(() => import('./pages/vendedores/Queue'));
const Customers = lazy(() => import('./pages/vendedores/Customers'));
const Vehicles = lazy(() => import('./pages/vendedores/Vehicles'));
const Admin = lazy(() => import('./pages/admin/Admin'));
const CustomerPortal = lazy(() => import('./pages/client/CustomerPortal'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AccountSettings = lazy(() => import('./pages/account/AccountSettings'));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

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
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
