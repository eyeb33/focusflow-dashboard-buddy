import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2, Timer, BookOpen, Brain, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ForgotPasswordForm from './ForgotPasswordForm';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type SignupFormValues = z.infer<typeof signupSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Timer,
    title: "Pomodoro timer",
    description: "Focus, short break, and long break modes to structure your study sessions."
  },
  {
    icon: BookOpen,
    title: "Syllabus tracking",
    description: "Pre-built A-level syllabus: pick your exam board, tick off topics as you go."
  },
  {
    icon: Brain,
    title: "AI tutor chat",
    description: "Get step-by-step explanations and hints tailored to your current topic."
  },
  {
    icon: BarChart3,
    title: "Progress dashboard",
    description: "See completion bars, time logged, and how close you are to mastery."
  }
];

const HeroAuthCard = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSignup = async (values: SignupFormValues) => {
    await signUp(values.email, values.password, values.name);
  };

  const onLogin = async (values: LoginFormValues) => {
    await signIn(values.email, values.password);
  };

  const handleBackFromForgotPassword = () => {
    setShowForgotPassword(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground mb-4">
          Stay focused. Master your A‑levels.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Syllabuddy combines a smart Pomodoro timer, syllabus‑aware topic tracking, and an AI tutor 
          so you always know what to work on next – and how well you're doing.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left: Features */}
        <div className="space-y-6">
          <div className="grid gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gemini Credits Note */}
          <div className="p-4 rounded-xl bg-accent/50 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Free AI credits:</span> Connect your Google Gemini account 
                to get a monthly pool of free AI credits without adding a card inside Syllabuddy.
              </p>
            </div>
          </div>

          {/* Demo Button */}
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/dashboard')}
          >
            View demo dashboard
          </Button>
        </div>

        {/* Right: Auth Card with Tabs */}
        <Card className="shadow-lg border-border/50">
          {showForgotPassword ? (
            <ForgotPasswordForm onBack={handleBackFromForgotPassword} />
          ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signup' | 'login')}>
            <TabsList className="grid w-full grid-cols-2 m-0 rounded-b-none">
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="login">Log in</TabsTrigger>
            </TabsList>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="mt-0">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Create your account</CardTitle>
                    <CardDescription>
                      Start tracking your focus sessions and mastering your syllabus.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <PasswordStrengthIndicator password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Create account
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>

            {/* Log In Tab */}
            <TabsContent value="login" className="mt-0">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)}>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>
                      Already using Syllabuddy? Log in to continue your progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Password</FormLabel>
                            <Button 
                              type="button" 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 text-xs"
                              onClick={() => setShowForgotPassword(true)}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Log in
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HeroAuthCard;
