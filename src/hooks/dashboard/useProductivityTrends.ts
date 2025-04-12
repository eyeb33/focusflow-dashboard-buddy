
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrendData {
  date: string;
  productivity: number;
}

export const useProductivityTrends = (userId: string | undefined) => {
  const [productivityTrend, setProductivityTrend] = useState<TrendData[]>([]);

  const fetchProductivityTrends = async () => {
    try {
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

      setProductivityTrend(formattedData);
      return formattedData;
    } catch (error: any) {
      console.error('Error fetching productivity trends:', error.message);
      return [];
    }
  };

  return { productivityTrend, fetchProductivityTrends };
};
