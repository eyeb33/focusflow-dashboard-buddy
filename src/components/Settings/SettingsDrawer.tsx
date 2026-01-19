import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import GeminiApiKeySettings from './GeminiApiKeySettings';
import { Settings } from 'lucide-react';

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenApiStats?: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onOpenChange, onOpenApiStats }) => {
  const handleOpenApiStats = () => {
    onOpenChange(false); // Close settings drawer
    onOpenApiStats?.();   // Open API stats drawer
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <GeminiApiKeySettings onOpenApiStats={onOpenApiStats ? handleOpenApiStats : undefined} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsDrawer;
