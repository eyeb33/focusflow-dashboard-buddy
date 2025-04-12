
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeUpdates = (userId: string | undefined, onUpdate: () => void) => {
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Focus session change received:', payload);
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions_summary', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Summary change received:', payload);
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'productivity_trends', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Trend change received:', payload);
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insights', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Insight change received:', payload);
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);
};
