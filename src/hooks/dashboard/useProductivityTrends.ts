
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrendData {
  date: string;
  productivity: number;
}

export const useProductivityTrends = (userId: string | undefined) => {
  const fetchProductivityTrends = async (): Promise<TrendData[]> => {
    try {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('productivity_trends')
        .select('date, productivity_score')
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        date: item.date,
        productivity: item.productivity_score
      })) || [];

      return formattedData;
    } catch (error: any) {
      console.error('Error fetching productivity trends:', error.message);
      return [];
    }
  };

  const result = useQuery({
    queryKey: ['productivityTrends', userId],
    queryFn: fetchProductivityTrends,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    productivityTrend: result.data || [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
