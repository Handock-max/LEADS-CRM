import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute, AdminRoute, ManagerRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import CRM from "./pages/CRM";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { AppLayout } from "./components/AppLayout";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter basename="/LEADS-CRM" /* Change this if repository name changes - must match vite.config.ts base */>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected routes */}
        <Route 
          path="/crm" 
          element={
            <AdminRoute>
              <AppLayout>
                <CRM />
              </AppLayout>
            </AdminRoute>
          } 
        />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'manager', 'agent']}>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>

        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
