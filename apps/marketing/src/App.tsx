
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { GlobalErrorBoundary } from "@/components/common/GlobalErrorBoundary";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { LazyRouteManager } from "@/components/layout/LazyRouteManager";
import { demoMode } from "@/utils/demoMode";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    demoMode.checkURLParam();
    demoMode.initKeyboardShortcuts();
  }, []);

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ModeProvider>
                <DemoModeBanner />
                <LazyRouteManager />
              </ModeProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
