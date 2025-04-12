
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InsightData {
  title: string;
  content: string;
}

export const useInsights = (userId: string | undefined) => {
  const fetchInsights = async (): Promise<InsightData[]> => {
    try {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('insights')
        .select('title, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // If no personal insights yet, generate some default ones
      const insightsData = data?.length ? data : [
        {
          title: 'Focus Tip',
          content: 'Try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break.'
        },
        {
          title: 'Productivity Insight',
          content: 'Research shows that taking regular breaks improves overall productivity and creativity.'
        },
        {
          title: 'Getting Started',
          content: 'Set small, achievable goals when you begin working to build momentum.'
        }
      ];

      return insightsData;
    } catch (error: any) {
      console.error('Error fetching insights:', error.message);
      return [];
    }
  };

  const result = useQuery({
    queryKey: ['insights', userId],
    queryFn: fetchInsights,
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes - reduced from 15 minutes
  });

  return {
    insights: result.data || [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  };
};
