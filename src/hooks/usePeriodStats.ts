
import { useCallback } from "react";
import { TimePeriod } from "@/components/Dashboard/TimeToggle";
import { mockDashboardData } from "@/data/mockDashboardData";

// Typing for stats
interface StatCard {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
}

interface UsePeriodStatsOptions {
  dashboardData: typeof mockDashboardData;
  selectedPeriod: TimePeriod;
}

export function usePeriodStats({ dashboardData, selectedPeriod }: UsePeriodStatsOptions): StatCard[] {
  const stats = dashboardData.stats;

  // For daily productivity, use chart data directly to ensure consistency
  const deriveDailySessionsAndMinutes = useCallback(() => {
    const dailyData = dashboardData.dailyProductivity;
    const totalMinutes = dailyData.reduce((sum, point) => sum + point.minutes, 0);
    const totalSessions = dailyData.reduce((sum, point) => sum + point.sessions, 0);
    const completedCycles = Math.floor(totalSessions / 4);
    return { totalMinutes, totalSessions, completedCycles };
  }, [dashboardData]);

  switch (selectedPeriod) {
    case "today": {
      const { totalMinutes, totalSessions, completedCycles } = deriveDailySessionsAndMinutes();
      return [
        {
          title: "Focus Minutes",
          value: totalMinutes,
          icon: "Flame",
          iconColor: "#ea384c"
        },
        {
          title: "Focus Sessions",
          value: totalSessions,
          icon: "Clock",
          iconColor: "#1EAEDB"
        },
        {
          title: "Completed Cycles",
          value: completedCycles,
          icon: "Cycle",
          iconColor: "#6DD5ED"
        }
      ];
    }
    case "week":
      return [
        {
          title: "Weekly Focus Minutes",
          value: stats.weeklyStats?.totalMinutes || 0,
          icon: "Flame",
          iconColor: "#ea384c"
        },
        {
          title: "Weekly Focus Sessions",
          value: stats.weeklyStats?.totalSessions || 0,
          icon: "Clock",
          iconColor: "#1EAEDB"
        },
        {
          title: "Weekly Completed Cycles",
          value: stats.weeklyStats?.completedCycles || 0,
          icon: "Cycle",
          iconColor: "#6DD5ED"
        }
      ];
    case "month":
      return [
        {
          title: "Monthly Focus Minutes",
          value: stats.monthlyStats?.totalMinutes || 0,
          icon: "Flame",
          iconColor: "#ea384c"
        },
        {
          title: "Monthly Focus Sessions",
          value: stats.monthlyStats?.totalSessions || 0,
          icon: "Clock",
          iconColor: "#1EAEDB"
        },
        {
          title: "Monthly Completed Cycles",
          value: stats.monthlyStats?.completedCycles || 0,
          icon: "Cycle",
          iconColor: "#6DD5ED"
        }
      ];
    default:
      return [];
  }
}
