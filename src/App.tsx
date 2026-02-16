import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Admin from './pages/Admin';
import CustomerPortal from './pages/CustomerPortal';
import NotFound from './pages/NotFound';
import { UserRole } from './types';

const queryClient = new QueryClient();

const Protected = ({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) => {
  const { user, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(roles)) return <Navigate to={user.role === 'customer' ? '/customer' : '/app'} replace />;
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
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/app"
                element={<Protected roles={['admin', 'employee']}><Header /><Dashboard /></Protected>}
              />
              <Route
                path="/queue"
                element={<Protected roles={['admin', 'employee']}><Header /><Queue /></Protected>}
              />
              <Route
                path="/admin"
                element={<Protected roles={['admin']}><Header /><Admin /></Protected>}
              />
              <Route
                path="/customer"
                element={<Protected roles={['customer']}><Header /><CustomerPortal /></Protected>}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
