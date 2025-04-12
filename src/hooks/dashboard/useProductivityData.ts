
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductivityDataPoint {
  name: string;
  sessions: number;
  minutes: number;
}

export interface ProductivityData {
  dailyProductivity: ProductivityDataPoint[];
  weeklyProductivity: ProductivityDataPoint[];
  monthlyProductivity: ProductivityDataPoint[];
}

export const useProductivityData = (userId: string | undefined) => {
  const [productivityData, setProductivityData] = useState<ProductivityData>({
    dailyProductivity: [],
    weeklyProductivity: [],
    monthlyProductivity: []
  });

  const fetchDailyProductivity = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by hour
      const hourlyData: Record<number, {sessions: number, minutes: number}> = {};
      
      for (let i = 0; i < 24; i++) {
        hourlyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const hour = new Date(session.created_at).getHours();
        if (session.completed) {
          hourlyData[hour].sessions += 1;
          hourlyData[hour].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      return Object.entries(hourlyData)
        .map(([hour, data]) => ({
          name: `${hour}:00`,
          sessions: data.sessions,
          minutes: data.minutes
        }));
    } catch (error: any) {
      console.error('Error fetching daily productivity:', error.message);
      return [];
    }
  };

  const fetchWeeklyProductivity = async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfWeek.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by day of week
      const dailyData: Record<number, {sessions: number, minutes: number}> = {};
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 0; i < 7; i++) {
        dailyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const dayOfWeek = new Date(session.created_at).getDay();
        if (session.completed) {
          dailyData[dayOfWeek].sessions += 1;
          dailyData[dayOfWeek].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      return Object.entries(dailyData)
        .map(([day, data]) => ({
          name: dayNames[parseInt(day)],
          sessions: data.sessions,
          minutes: data.minutes
        }));
    } catch (error: any) {
      console.error('Error fetching weekly productivity:', error.message);
      return [];
    }
  };

  const fetchMonthlyProductivity = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('created_at, duration, completed')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .eq('session_type', 'work');

      if (error) throw error;

      // Group sessions by day of month
      const dailyData: Record<number, {sessions: number, minutes: number}> = {};
      
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { sessions: 0, minutes: 0 };
      }

      data?.forEach(session => {
        const dayOfMonth = new Date(session.created_at).getDate();
        if (session.completed) {
          dailyData[dayOfMonth].sessions += 1;
          dailyData[dayOfMonth].minutes += Math.floor(session.duration / 60);
        }
      });

      // Format data for chart
      return Object.entries(dailyData)
        .map(([day, data]) => ({
          name: `${day}`,
          sessions: data.sessions,
          minutes: data.minutes
        }));
    } catch (error: any) {
      console.error('Error fetching monthly productivity:', error.message);
      return [];
    }
  };

  const fetchAllProductivityData = async () => {
    try {
      const daily = await fetchDailyProductivity();
      const weekly = await fetchWeeklyProductivity();
      const monthly = await fetchMonthlyProductivity();

      const newData = {
        dailyProductivity: daily,
        weeklyProductivity: weekly,
        monthlyProductivity: monthly
      };

      setProductivityData(newData);
      return newData;
    } catch (error: any) {
      console.error('Error fetching productivity data:', error.message);
      return productivityData;
    }
  };

  return { productivityData, fetchAllProductivityData };
};
