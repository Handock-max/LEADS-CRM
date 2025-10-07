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
  // Temporarily bypass Supabase connection for deployment testing
  // const { isConnected, isLoading, error, retryConnection } = useSupabaseConnection();

  // Render main app directly for now
  return (
    <BrowserRouter basename="/LEADS-CRM" /* Change this if repository name changes - must match vite.config.ts base */>
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
