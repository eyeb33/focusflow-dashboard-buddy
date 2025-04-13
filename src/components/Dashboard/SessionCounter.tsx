
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resetUserStats } from '@/utils/resetUserStats';

interface SessionCounterProps {
  sessions: number;
  onRefresh: () => Promise<void>;
}

const SessionCounter: React.FC<SessionCounterProps> = ({ sessions, onRefresh }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleReset = async () => {
    if (!user) return;
    
    try {
      const success = await resetUserStats(user.id);
      
      if (success) {
        toast({
          title: "Stats Reset",
          description: "Your session count has been reset to 0 for testing.",
        });
        
        // Refresh the dashboard data
        await onRefresh();
      } else {
        toast({
          title: "Reset Failed",
          description: "There was a problem resetting your stats.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error resetting your stats.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg font-medium">Completed Focus Sessions</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
            title="Refresh Sessions"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
            title="Reset Sessions (Testing)"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold">{sessions}</p>
            <p className="text-sm text-muted-foreground">Total completed focus sessions</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              Completion Rate: <span className="font-medium text-foreground">
                {sessions > 0 ? '100%' : '0%'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCounter;
