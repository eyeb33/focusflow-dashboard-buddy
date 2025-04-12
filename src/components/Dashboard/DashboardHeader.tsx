
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

const DashboardHeader: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setUsername(data.username);
        }
      }
    };

    getProfile();
  }, [user]);

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">
        {username 
          ? `${username}'s Dashboard` 
          : 'Dashboard'
        }
      </h1>
      <p className="text-muted-foreground mt-1">
        Track your focus sessions, tasks, and productivity insights
      </p>
    </div>
  );
};

export default DashboardHeader;
