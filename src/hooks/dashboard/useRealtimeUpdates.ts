
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to real-time database updates and invalidate appropriate queries
 * instead of triggering full refetches
 */
export const useRealtimeUpdates = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    
    console.log('Setting up real-time updates for user:', userId);
    
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Focus session change received:', payload);
          // Invalidate specific queries instead of triggering a full refetch
          queryClient.invalidateQueries({ queryKey: ['stats', userId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions_summary', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('Summary change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['stats', userId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          console.log('Profile change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};
