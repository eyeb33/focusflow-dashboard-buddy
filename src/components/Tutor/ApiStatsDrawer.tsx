import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Sparkles, Clock, Info, Settings } from 'lucide-react';
import { useApiUsage, API_LIMITS, getUsageStatus, getProgressColor } from '@/hooks/useApiUsage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ApiStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
}

const ApiStatsDrawer: React.FC<ApiStatsDrawerProps> = ({ open, onOpenChange, onOpenSettings }) => {
  const { requestsToday, tokensToday, lastRequestAt, isLoading } = useApiUsage();
  const status = getUsageStatus(requestsToday);
  const progressColor = getProgressColor(requestsToday);
  
  const percentage = Math.min((requestsToday / API_LIMITS.REQUESTS_PER_DAY) * 100, 100);
  
  // Estimate tokens per minute based on recent activity (rough approximation)
  const estimatedTPM = Math.round(tokensToday / Math.max(1, requestsToday) * 0.5);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            API Usage & Info
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Status Indicator */}
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg",
            status.status === 'healthy' && "bg-green-500/10",
            status.status === 'warning' && "bg-orange-500/10",
            status.status === 'critical' && "bg-destructive/10"
          )}>
            <span className="text-lg">
              {status.status === 'healthy' && '🟢'}
              {status.status === 'warning' && '🟡'}
              {status.status === 'critical' && '🔴'}
            </span>
            <span className={cn("font-medium", status.color)}>
              {status.label}
            </span>
          </div>

          <Separator />

          {/* Connected Model */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Connected Model
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">gemini-2.0-flash</span>
              <Badge variant="secondary" className="text-xs">
                Free Tier
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Requests Today */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Requests Today
            </label>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">
                  {isLoading ? '...' : requestsToday.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  / {API_LIMITS.REQUESTS_PER_DAY.toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-300", progressColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rate Limits */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Rate Limits
            </label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per minute:</span>
                <span className="font-mono">— / {API_LIMITS.REQUESTS_PER_MINUTE} RPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per day:</span>
                <span className="font-mono">
                  {isLoading ? '...' : requestsToday.toLocaleString()} / {API_LIMITS.REQUESTS_PER_DAY.toLocaleString()} RPD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens/min:</span>
                <span className="font-mono">
                  ~{isLoading ? '...' : `${estimatedTPM}K`} / 1M TPM
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Last Request */}
          {lastRequestAt && (
            <div className="text-sm text-muted-foreground">
              Last request: {formatTime(lastRequestAt)}
            </div>
          )}

          {/* Info Footer */}
          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Free tier quota resets every 24 hours (UTC midnight)</span>
            </div>
            {onOpenSettings && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  onOpenChange(false);
                  onOpenSettings();
                }}
              >
                <Settings className="h-3.5 w-3.5 mr-2" />
                Manage your API key in Settings
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApiStatsDrawer;
