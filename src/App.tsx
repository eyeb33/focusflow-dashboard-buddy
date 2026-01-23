import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/Theme/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { CoachProvider } from "@/contexts/CoachContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Curriculum from "./pages/Curriculum";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import React, { useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";

// Create a new QueryClient instance outside of the component
const queryClient = new QueryClient();

const ScrollManager = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Lock *document* scrolling globally; pages should implement scrolling within their own layout.
    // This prevents "blank white" overscroll caused by mixing page scroll + internal scroll.
    const shouldLock = true;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = shouldLock ? 'hidden' : '';
    body.style.overflow = shouldLock ? 'hidden' : '';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [location.pathname, user]);

  return null;
};

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <TimerProvider>
                <CoachProvider>
                  <ScrollManager />
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route 
                      path="/" 
                      element={
                        <ErrorBoundary fallbackTitle="Timer failed to load">
                          <Index />
                        </ErrorBoundary>
                      } 
                    />
                    <Route 
                      path="/dashboard" 
                      element={
                        <ErrorBoundary fallbackTitle="Dashboard failed to load">
                          <Dashboard />
                        </ErrorBoundary>
                      } 
                    />
                    <Route path="/auth" element={<Auth />} />
                    <Route 
                      path="/curriculum" 
                      element={
                        <ErrorBoundary fallbackTitle="Curriculum failed to load">
                          <Curriculum />
                        </ErrorBoundary>
                      } 
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </CoachProvider>
              </TimerProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
