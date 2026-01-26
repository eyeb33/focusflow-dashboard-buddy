import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ApiUsageData {
  requestsToday: number;
  tokensToday: number;
  requestsThisMonth: number;
  tokensThisMonth: number;
  lastRequestAt: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useApiUsage = (): ApiUsageData => {
  const { user } = useAuth();
  const [requestsToday, setRequestsToday] = useState(0);
  const [tokensToday, setTokensToday] = useState(0);
  const [requestsThisMonth, setRequestsThisMonth] = useState(0);
  const [tokensThisMonth, setTokensThisMonth] = useState(0);
  const [lastRequestAt, setLastRequestAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      
      // Get first day of current month (YYYY-MM-01)
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      
      // Fetch today's usage
      const { data: todayData, error: todayError } = await supabase
        .from('api_usage')
        .select('request_count, token_count, last_request_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (todayError) {
        throw todayError;
      }

      // Fetch monthly usage (aggregate all days from 1st of month)
      const { data: monthData, error: monthError } = await supabase
        .from('api_usage')
        .select('request_count, token_count')
        .eq('user_id', user.id)
        .gte('date', firstOfMonth)
        .lte('date', today);

      if (monthError) {
        throw monthError;
      }

      // Set today's data
      if (todayData) {
        setRequestsToday(todayData.request_count || 0);
        setTokensToday(todayData.token_count || 0);
        setLastRequestAt(todayData.last_request_at);
      } else {
        setRequestsToday(0);
        setTokensToday(0);
        setLastRequestAt(null);
      }

      // Aggregate monthly totals
      if (monthData && monthData.length > 0) {
        const monthlyRequests = monthData.reduce((sum, day) => sum + (day.request_count || 0), 0);
        const monthlyTokens = monthData.reduce((sum, day) => sum + (day.token_count || 0), 0);
        setRequestsThisMonth(monthlyRequests);
        setTokensThisMonth(monthlyTokens);
      } else {
        setRequestsThisMonth(0);
        setTokensThisMonth(0);
      }
    } catch (err) {
      console.error('Failed to fetch API usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    
    // Refetch every 30 seconds to stay updated
    const interval = setInterval(fetchUsage, 30_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    requestsToday,
    tokensToday,
    requestsThisMonth,
    tokensThisMonth,
    lastRequestAt,
    isLoading,
    error,
    refetch: fetchUsage,
  };
};

// Helper to calculate status - simplified since we removed hard limits
export const getUsageStatus = (): {
  status: 'healthy';
  label: string;
  color: string;
} => {
  return { status: 'healthy', label: 'All systems healthy', color: 'text-green-500' };
};

// Helper to format large numbers
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};
