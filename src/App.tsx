import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CRM from "./pages/CRM";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/AppLayout";
import { useSupabaseConnection } from "./hooks/useSupabaseConnection";
import { SupabaseConnectionError } from "./components/SupabaseConnectionError";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnected, isLoading, error, retryConnection } = useSupabaseConnection();

  // Show loading state while checking connection
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  // Show error state if connection failed
  if (!isConnected && error) {
    return (
      <SupabaseConnectionError 
        error={error} 
        onRetry={retryConnection}
        isRetrying={isLoading}
      />
    );
  }

  // Render main app if connected
  return (
    <BrowserRouter basename="/LEADS-CRM">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/crm" element={<AppLayout><CRM /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
