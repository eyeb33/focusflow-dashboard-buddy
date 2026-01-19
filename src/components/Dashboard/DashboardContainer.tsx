
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import DashboardContent from "@/components/Dashboard/DashboardContent";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";
import bgWork from '@/assets/bg-work.png';

const DashboardContainer = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: dataLoading, refetch } = useDashboard();
  const navigate = useNavigate();
  const visibilityChangedRef = useRef(false);
  const { theme } = useTheme();

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
    <div 
      className="min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgWork})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for dark mode + gradient fade to top */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-colors duration-500",
        theme === 'dark' 
          ? "bg-gradient-to-t from-black/90 via-black/85 to-black/80" 
          : "bg-gradient-to-t from-transparent via-transparent to-white/30"
      )} />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="relative flex flex-col items-center justify-start py-6 px-4 md:px-8 h-full">
          <div className="w-full max-w-[92%] mx-auto bg-white dark:bg-card rounded-3xl shadow-2xl p-6 flex flex-col relative h-[calc(100vh-80px)]">
            <div className="flex-shrink-0">
              <Header />
            </div>
            <div className="mt-4 flex-1 min-h-0 overflow-y-auto px-2">
              <DashboardHeader />
              <DashboardContent />
            </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default DashboardContainer;
