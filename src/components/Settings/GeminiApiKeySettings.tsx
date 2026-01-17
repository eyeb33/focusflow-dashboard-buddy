import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Key, CheckCircle, XCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GeminiApiKeySettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (user) {
      fetchExistingKey();
    }
  }, [user]);

  const fetchExistingKey = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('gemini_api_key')
      .eq('user_id', user.id)
      .single();

    if (!error && data?.gemini_api_key) {
      setHasExistingKey(true);
      // Mask the key for display
      const key = data.gemini_api_key;
      setMaskedKey(`${key.slice(0, 8)}${'•'.repeat(20)}${key.slice(-4)}`);
    }
  };

  const validateApiKey = async (key: string): Promise<boolean> => {
    // Basic format validation
    if (!key.startsWith('AIza') || key.length < 30) {
      return false;
    }

    try {
      // Test the key with a simple API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hi' }] }]
          })
        }
      );
      
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleSaveKey = async () => {
    if (!user || !apiKey.trim()) return;

    setIsValidating(true);
    const valid = await validateApiKey(apiKey);
    setIsValid(valid);
    setIsValidating(false);

    if (!valid) {
      toast({
        title: "Invalid API Key",
        description: "The API key couldn't be validated. Please check it's correct and has access to Gemini.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ gemini_api_key: apiKey })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been saved successfully. The AI tutor will now use your quota.",
      });
      
      setHasExistingKey(true);
      setMaskedKey(`${apiKey.slice(0, 8)}${'•'.repeat(20)}${apiKey.slice(-4)}`);
      setApiKey('');
      setIsValid(null);
    } catch (error: any) {
      toast({
        title: "Error Saving Key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ gemini_api_key: null })
        .eq('user_id', user.id);

      if (error) throw error;

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
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-mono flex-1">{maskedKey}</span>
              <Button variant="outline" size="sm" onClick={handleRemoveKey} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your AI tutor is using your personal Gemini quota.
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
                  setIsValid(null);
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

            {isValid !== null && (
              <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                {isValid ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>API key is valid!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Invalid API key. Please check and try again.</span>
                  </>
                )}
              </div>
            )}

            <Button 
              onClick={handleSaveKey} 
              disabled={!apiKey.trim() || isLoading || isValidating}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Validating...
                </>
              ) : isLoading ? (
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
