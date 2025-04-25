
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomodoro-work" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <DashboardHeader />
        <DashboardContent />
      </div>
      <MobileNav />
    </div>
  );
};

export default DashboardContainer;
