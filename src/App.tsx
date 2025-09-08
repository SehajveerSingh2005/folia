import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./components/ThemeProvider";

import DashboardLayoutPage from "./pages/DashboardLayoutPage";
import DashboardOverviewWrapper from "./components/DashboardOverviewWrapper";
import Flow from "./components/spaces/Flow";
import Loom from "./components/spaces/Loom";
import Garden from "./components/spaces/Garden";
import Journal from "./components/spaces/Journal";
import Horizon from "./components/spaces/Horizon";
import Archive from "./components/spaces/Archive";

const queryClient = new QueryClient();

const APP_VERSION = "1.1.0"; // Increment this version to trigger a settings reset for all users

const App = () => {
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion !== APP_VERSION) {
      // Clear potentially outdated settings
      localStorage.removeItem('flowViewMode');
      localStorage.removeItem('flowSortMode');
      
      // Clear all dashboard widget layouts
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dashboardWidgets_')) {
          localStorage.removeItem(key);
        }
      });

      localStorage.setItem('app_version', APP_VERSION);
      console.log(`Upgraded to version ${APP_VERSION} and cleared old settings.`);
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/settings" element={<Settings />} />

              <Route element={<DashboardLayoutPage />}>
                <Route path="/dashboard" element={<DashboardOverviewWrapper />} />
                <Route path="/flow" element={<Flow />} />
                <Route path="/loom" element={<Loom />} />
                <Route path="/garden" element={<Garden />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/horizon" element={<Horizon />} />
                <Route path="/archive" element={<Archive />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;