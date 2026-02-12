import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TimeToggle, { TimePeriod } from "@/components/Dashboard/TimeToggle";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import TaskTimeCard from "@/components/Dashboard/TaskTimeCard";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import StudyStreak from "@/components/Dashboard/StudyStreak";
import { useDashboard } from '@/contexts/DashboardContext';
import { useTasks } from '@/hooks/useTasks';
import { ExperimentalRadialChart } from '@/components/Dashboard/ExperimentalRadialChart';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useToast } from '@/hooks/use-toast';

const PERIODS: TimePeriod[] = ['yesterday', 'today', 'week', 'month'];
const PERIOD_LABELS: Record<TimePeriod, string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
};

const DashboardContent = () => {
  const { selectedPeriod, setSelectedPeriod, dashboardData, isDemoMode } = useDashboard();
  const { tasks, deleteTask } = useTasks();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Navigate to previous/next period
  const goToPreviousPeriod = useCallback(() => {
    const currentIndex = PERIODS.indexOf(selectedPeriod);
    if (currentIndex > 0) {
      const newPeriod = PERIODS[currentIndex - 1];
      setSelectedPeriod(newPeriod);
      toast({
        title: PERIOD_LABELS[newPeriod],
        description: "Swipe right for earlier, left for later",
        duration: 1500,
      });
    }
  }, [selectedPeriod, setSelectedPeriod, toast]);

  const goToNextPeriod = useCallback(() => {
    const currentIndex = PERIODS.indexOf(selectedPeriod);
    if (currentIndex < PERIODS.length - 1) {
      const newPeriod = PERIODS[currentIndex + 1];
      setSelectedPeriod(newPeriod);
      toast({
        title: PERIOD_LABELS[newPeriod],
        description: "Swipe right for earlier, left for later",
        duration: 1500,
      });
    }
  }, [selectedPeriod, setSelectedPeriod, toast]);

  // Swipe handlers - swipe right goes to previous (earlier), swipe left goes to next (later)
  const swipeHandlers = useSwipeGesture({
    onSwipeRight: goToPreviousPeriod,
    onSwipeLeft: goToNextPeriod,
    minSwipeDistance: 50,
    maxSwipeTime: 400,
  });

  const getPeriodStats = () => {
    const stats = dashboardData.stats;
    
    switch (selectedPeriod) {
      case 'yesterday':
      case 'today': {
        const dailyData = dashboardData.dailyProductivity;
        const totalMinutes = dailyData.reduce((sum: number, point: any) => sum + point.minutes, 0);
        const totalSessions = dailyData.reduce((sum: number, point: any) => sum + point.sessions, 0);
        const completedCycles = Math.floor(totalSessions / 4);
        
        return [
          {
            title: "Focus Minutes",
            value: totalMinutes,
            icon: "Flame",
            iconColor: "#ea384c",
            trend: stats.dailyStats ? {
              value: stats.dailyStats.minutesTrend,
              isPositive: stats.dailyStats.minutesTrend >= 0
            } : undefined
          },
          {
            title: "Focus Sessions",
            value: totalSessions,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.dailyStats ? {
              value: stats.dailyStats.sessionsTrend,
              isPositive: stats.dailyStats.sessionsTrend >= 0
            } : undefined
          },
          {
            title: "Completed Cycles",
            value: completedCycles,
            icon: "Cycle",
            iconColor: "#6DD5ED",
            trend: stats.weeklyChange ? {
              value: stats.weeklyChange.dailyAvg,
              isPositive: stats.weeklyChange.isPositive
            } : undefined
          },
        ];
      }
      case 'week':
        return [
          {
            title: "Weekly Focus Minutes",
            value: stats.weeklyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c",
            trend: stats.weeklyStats?.minutesTrend ? {
              value: stats.weeklyStats.minutesTrend,
              isPositive: stats.weeklyStats.minutesTrend >= 0
            } : undefined,
            description: stats.weeklyStats?.minutesTrend ? "from last week" : undefined
          },
          {
            title: "Weekly Focus Sessions",
            value: stats.weeklyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.weeklyStats?.sessionsTrend ? {
              value: stats.weeklyStats.sessionsTrend,
              isPositive: stats.weeklyStats.sessionsTrend >= 0
            } : undefined,
            description: stats.weeklyStats?.sessionsTrend ? "from last week" : undefined
          },
          {
            title: "Weekly Completed Cycles",
            value: stats.weeklyStats?.completedCycles || 0,
            icon: "Cycle",
            iconColor: "#6DD5ED",
            trend: stats.weeklyChange ? {
              value: stats.weeklyChange.sessions,
              isPositive: stats.weeklyChange.isPositive
            } : undefined,
            description: stats.weeklyChange?.sessions ? "from last week" : undefined
          },
        ];
      case 'month':
        return [
          {
            title: "Monthly Focus Minutes",
            value: stats.monthlyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c",
            trend: stats.monthlyStats?.minutesTrend ? {
              value: stats.monthlyStats.minutesTrend,
              isPositive: stats.monthlyStats.minutesTrend >= 0
            } : undefined,
            description: stats.monthlyStats?.minutesTrend ? "from last month" : undefined
          },
          {
            title: "Monthly Focus Sessions",
            value: stats.monthlyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.monthlyStats?.sessionsTrend ? {
              value: stats.monthlyStats.sessionsTrend,
              isPositive: stats.monthlyStats.sessionsTrend >= 0
            } : undefined,
            description: stats.monthlyStats?.sessionsTrend ? "from last month" : undefined
          },
          {
            title: "Monthly Completed Cycles",
            value: stats.monthlyStats?.completedCycles || 0,
            icon: "Cycle",
            iconColor: "#6DD5ED",
            trend: stats.monthlyChange ? {
              value: stats.monthlyChange.sessions,
              isPositive: stats.monthlyChange.isPositive
            } : undefined,
            description: stats.monthlyChange?.sessions ? "from last month" : undefined
          },
        ];
      default:
        return [];
    }
  };

  // Check if we're at the edges
  const currentIndex = PERIODS.indexOf(selectedPeriod);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < PERIODS.length - 1;

  return (
    <div 
      className="space-y-4 md:space-y-6"
      {...swipeHandlers}
    >
      {isDemoMode && (
        <div className="bg-muted p-3 sm:p-4 rounded-lg border border-muted-foreground/20 mb-4 md:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <h3 className="font-medium text-sm sm:text-base">Demo Dashboard</h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            You're viewing demo data. Sign up to track your own productivity and create a personalized dashboard.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-pomodoro-work hover:bg-pomodoro-work/90 min-h-[44px] px-4 touch-manipulation"
              onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            >
              Sign Up Now
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="min-h-[44px] px-4 touch-manipulation"
              onClick={() => navigate('/auth', { state: { mode: 'login' } })}
            >
              Log In
            </Button>
          </div>
        </div>
      )}
      
      {/* TimeToggle with swipe navigation hint on mobile */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 w-full justify-center">
          {/* Previous arrow - visible on mobile */}
          <button
            onClick={goToPreviousPeriod}
            disabled={!canGoPrevious}
            className="md:hidden p-2 rounded-full bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors active:bg-muted"
            aria-label="Previous time period"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TimeToggle
              selectedPeriod={selectedPeriod}
              onChange={setSelectedPeriod}
            />
          </div>
          
          {/* Next arrow - visible on mobile */}
          <button
            onClick={goToNextPeriod}
            disabled={!canGoNext}
            className="md:hidden p-2 rounded-full bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors active:bg-muted"
            aria-label="Next time period"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        
        {/* Swipe hint - only on mobile */}
        <p className="text-xs text-muted-foreground md:hidden">
          Swipe to change time period
        </p>
      </div>
      
      <StatCardsGrid stats={getPeriodStats()} />
      
      {/* Study Streak with Badges - prominent position */}
      <StudyStreak 
        currentStreak={dashboardData.stats.currentStreak}
        bestStreak={dashboardData.stats.bestStreak}
      />
      
      {/* Charts and Calendar - stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 order-1">
          <ChartsGrid
            dailyData={dashboardData.dailyProductivity}
            weeklyData={dashboardData.weeklyProductivity}
            monthlyData={dashboardData.monthlyProductivity}
            selectedPeriod={selectedPeriod}
          />
        </div>
        <div className="lg:col-span-1 order-2">
          <StreakCalendar
            data={dashboardData.streakData}
            currentStreak={dashboardData.stats.currentStreak}
            bestStreak={dashboardData.stats.bestStreak}
          />
        </div>
      </div>
      
      <div className="mt-4 md:mt-6">
        <ExperimentalRadialChart dailyData={dashboardData.dailyProductivity} />
      </div>
      
      <div className="mt-4 md:mt-6">
        <TaskTimeCard tasks={tasks} selectedPeriod={selectedPeriod} onTaskDeleted={deleteTask} />
      </div>
    </div>
  );
};

export default DashboardContent;
