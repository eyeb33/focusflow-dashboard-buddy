import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, CheckCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeminiApiKeySettingsProps {
  onOpenApiStats?: () => void;
}

const GeminiApiKeySettings: React.FC<GeminiApiKeySettingsProps> = ({ onOpenApiStats }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (user) {
      fetchExistingKey();
    }
  }, [user]);

  const fetchExistingKey = async () => {
    if (!user) return;

    try {
      // Use the secure edge function to check if key exists (never returns actual key)
          // Get session for authentication
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
                  console.warn('No active session');
                  return;
                }
      
      const { data, error } = await supabase.functions.invoke('manage-api-key', {
              headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
        body: { action: 'check' }
      });

      if (error) {
        console.warn('Failed to check Gemini API key status:', error.message);
        return;
      }

      if (data?.hasKey) {
        setHasExistingKey(true);
        setMaskedKey(data.maskedKey);
      }
    } catch (err) {
      console.warn('Error checking API key:', err);
    }
  };

  const isPlausibleApiKey = (key: string) => {
    const trimmed = key.trim();
    return trimmed.startsWith('AIza') && trimmed.length >= 30;
  };

  const handleSaveKey = async () => {
    if (!user || !apiKey.trim()) return;

    if (!isPlausibleApiKey(apiKey)) {
      toast({
        title: 'Invalid API Key',
        description: 'Please paste a valid Gemini API key (it usually starts with "AIza…").',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use the secure edge function to save the key
          // Get session for authentication
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
                  console.warn('No active session');
                  return;
                }
      
      const { data, error } = await supabase.functions.invoke('manage-api-key', {
              headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
        body: { action: 'save', api_key: apiKey.trim() }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to save API key');

      toast({
        title: 'API Key Saved',
        description: 'Saved. The tutor will only contact Gemini when you send a message.',
      });

      setHasExistingKey(true);
      setMaskedKey(data.maskedKey);
      setApiKey('');
    } catch (error: any) {
      toast({
        title: 'Error Saving Key',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Use the secure edge function to remove the key
          // Get session for authentication
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
                  console.warn('No active session');
                  return;
                }
      
      const { data, error } = await supabase.functions.invoke('manage-api-key', {
              headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
        body: { action: 'remove' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to remove API key');

      toast({
        title: "API Key Removed",
        description: "Your Gemini API key has been removed.",
      });
      
      setHasExistingKey(false);
      setMaskedKey(null);
    } catch (error: any) {
      toast({
        title: "Error Removing Key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gemini API Key
        </CardTitle>
        <CardDescription>
          Add your own Gemini API key to use the AI tutor with your personal quota (free with Google account)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-medium mb-2">How to get your free Gemini API key:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google AI Studio <ExternalLink className="h-3 w-3" /></a></li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API key"</li>
              <li>Copy the key (starts with "AIza...")</li>
            </ol>
            <p className="mt-2 text-xs">
              💡 Students can get free Gemini Advanced at <a href="https://gemini.google/students/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gemini.google/students</a>
            </p>
          </AlertDescription>
        </Alert>

        {hasExistingKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-sm font-mono flex-1 truncate">{maskedKey}</span>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleRemoveKey} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? 'Removing...' : 'Remove API Key'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Your AI tutor is using{' '}
              {onOpenApiStats ? (
                <button 
                  onClick={onOpenApiStats}
                  className="text-primary hover:underline font-medium"
                >
                  your personal Gemini quota
                </button>
              ) : (
                'your personal Gemini quota'
              )}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                }}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            <Button 
              onClick={handleSaveKey} 
              disabled={!apiKey.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save API Key'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeminiApiKeySettings;
