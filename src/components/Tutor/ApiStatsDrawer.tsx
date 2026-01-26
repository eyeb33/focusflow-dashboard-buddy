import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Sparkles, Clock, Calendar, Info, Settings } from 'lucide-react';
import { useApiUsage, getUsageStatus, formatNumber } from '@/hooks/useApiUsage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ApiStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
}

const ApiStatsDrawer: React.FC<ApiStatsDrawerProps> = ({ open, onOpenChange, onOpenSettings }) => {
  const { requestsToday, tokensToday, requestsThisMonth, tokensThisMonth, lastRequestAt, isLoading } = useApiUsage();
  const status = getUsageStatus();

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
            "bg-green-500/10"
          )}>
            <span className="text-lg">🟢</span>
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
              <span className="font-mono text-sm">gemini-3.0-flash</span>
              <Badge variant="secondary" className="text-xs">
                Free Tier
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Today's Usage */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Requests</span>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : requestsToday.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Tokens</span>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : formatNumber(tokensToday)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Monthly Usage */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Requests</span>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : requestsThisMonth.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Tokens</span>
                <p className="text-2xl font-bold">
                  {isLoading ? '...' : formatNumber(tokensThisMonth)}
                </p>
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
              <span>Monthly stats reset on the 1st of each month</span>
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
