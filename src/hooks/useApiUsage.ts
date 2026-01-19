import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ApiUsageData {
  requestsToday: number;
  tokensToday: number;
  lastRequestAt: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Free tier limits
export const API_LIMITS = {
  REQUESTS_PER_MINUTE: 15,
  REQUESTS_PER_DAY: 1500,
  TOKENS_PER_MINUTE: 1_000_000,
};

export const useApiUsage = (): ApiUsageData => {
  const { user } = useAuth();
  const [requestsToday, setRequestsToday] = useState(0);
  const [tokensToday, setTokensToday] = useState(0);
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
      
      const { data, error: fetchError } = await supabase
        .from('api_usage')
        .select('request_count, token_count, last_request_at')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setRequestsToday(data.request_count || 0);
        setTokensToday(data.token_count || 0);
        setLastRequestAt(data.last_request_at);
      } else {
        setRequestsToday(0);
        setTokensToday(0);
        setLastRequestAt(null);
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
    lastRequestAt,
    isLoading,
    error,
    refetch: fetchUsage,
  };
};

// Helper to calculate status
export const getUsageStatus = (requestsToday: number): {
  status: 'healthy' | 'warning' | 'critical';
  label: string;
  color: string;
} => {
  const percentage = (requestsToday / API_LIMITS.REQUESTS_PER_DAY) * 100;
  
  if (percentage >= 93) {
    return { status: 'critical', label: 'Near daily limit', color: 'text-destructive' };
  }
  if (percentage >= 66) {
    return { status: 'warning', label: 'Approaching limits', color: 'text-orange-500' };
  }
  return { status: 'healthy', label: 'All systems healthy', color: 'text-green-500' };
};

// Helper to get progress bar color
export const getProgressColor = (requestsToday: number): string => {
  const percentage = (requestsToday / API_LIMITS.REQUESTS_PER_DAY) * 100;
  
  if (percentage >= 93) return 'bg-destructive';
  if (percentage >= 66) return 'bg-orange-500';
  return 'bg-green-500';
};
