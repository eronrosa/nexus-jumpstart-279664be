import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import PageTransition from "./components/PageTransition";
import Index from "./pages/Index";
import CouponDetail from "./pages/CouponDetail";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import ZuuFood from "./pages/ZuuFood";
import PedidosPage from "./pages/PedidosPage";
import PainelPage from "./pages/PainelPage";
import ZuuMob from "./pages/ZuuMob";
import MotoristaPage from "./pages/MotoristaPage";
import RideHistoryPage from "./pages/RideHistoryPage";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import ZuuChat from "./pages/ZuuChat";
import ZuuPass from "./pages/ZuuPass";

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

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/coupondetail" element={<PageTransition><CouponDetail /></PageTransition>} />
        <Route path="/zuufood" element={<PageTransition><ZuuFood /></PageTransition>} />
        <Route path="/zuufood/r/:restaurantId" element={<PageTransition><ZuuFood /></PageTransition>} />
        <Route path="/pedidos" element={<ProtectedRoute><PageTransition><PedidosPage /></PageTransition></ProtectedRoute>} />
        <Route path="/painel" element={<ProtectedRoute><PageTransition><PainelPage /></PageTransition></ProtectedRoute>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/perfil" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/zuumob" element={<PageTransition><ZuuMob /></PageTransition>} />
        <Route path="/motorista" element={<ProtectedRoute><PageTransition><MotoristaPage /></PageTransition></ProtectedRoute>} />
        <Route path="/zuumob/historico" element={<ProtectedRoute><PageTransition><RideHistoryPage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
        <Route path="/zuuchat" element={<ProtectedRoute><PageTransition><ZuuChat /></PageTransition></ProtectedRoute>} />
        <Route path="/zuupass" element={<PageTransition><ZuuPass /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AnimatedRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

