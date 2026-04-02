import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import CouponDetail from "./pages/CouponDetail";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ZuuFood from "./pages/ZuuFood";
import PedidosPage from "./pages/PedidosPage";
import PainelPage from "./pages/PainelPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/coupondetail" element={<CouponDetail />} />
              <Route path="/zuufood" element={<ZuuFood />} />
              <Route path="/pedidos" element={<ProtectedRoute><PedidosPage /></ProtectedRoute>} />
              <Route path="/painel" element={<ProtectedRoute><PainelPage /></ProtectedRoute>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

