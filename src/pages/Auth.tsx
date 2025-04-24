
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthHeader from '@/components/Auth/AuthHeader';
import LoginForm from '@/components/Auth/LoginForm';
import SignupForm from '@/components/Auth/SignupForm';

interface LocationState {
  mode?: 'login' | 'signup';
}

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = (location.state as LocationState) || {};
  const { user, isLoading, signIn, signUp } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(mode || 'login');
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomodoro-work" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-muted/50 to-background">
      <AuthHeader />
      
      <Card className="w-full max-w-md">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm
              onSubmit={(values) => signIn(values.email, values.password)}
              isLoading={isLoading}
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
            />
          </TabsContent>
          
          <TabsContent value="signup">
            <SignupForm
              onSubmit={(values) => signUp(values.email, values.password, values.name)}
              isLoading={isLoading}
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
            />
          </TabsContent>
        </Tabs>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Button variant="link" onClick={() => navigate('/')}>
          Go back to timer
        </Button>
      </div>
    </div>
  );
};

export default Auth;
