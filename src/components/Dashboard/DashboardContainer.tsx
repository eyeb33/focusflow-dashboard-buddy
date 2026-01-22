import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardContent from "@/components/Dashboard/DashboardContent";

const DashboardContainer = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: dataLoading, refetch } = useDashboard();
  const visibilityChangedRef = useRef(false);

  // Handle tab visibility with reduced frequency of refreshes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityChangedRef.current = true;
      } else if (visibilityChangedRef.current) {
        const lastActiveTime = localStorage.getItem('lastActiveTime');
        const now = Date.now();
        if (lastActiveTime && (now - parseInt(lastActiveTime)) > 30000) {
          refetch();
        }
        visibilityChangedRef.current = false;
        localStorage.setItem('lastActiveTime', now.toString());
      }
    };

    localStorage.setItem('lastActiveTime', Date.now().toString());
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="container max-w-7xl mx-auto py-6 px-4 md:px-6 lg:px-8">
          <DashboardHeader />
          <DashboardContent />
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default DashboardContainer;
