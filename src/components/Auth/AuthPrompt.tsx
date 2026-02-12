
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthPromptProps {
  onSignupClick: () => void;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ onSignupClick }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-12">
      <h2 className="text-2xl font-display font-semibold mb-3">
        Track your productivity and access the AI assistant
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sign up to track your progress, analyze your productivity patterns, and get personalized help from your AI study assistant.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Button onClick={onSignupClick} className="bg-pomodoro-work hover:bg-pomodoro-work/90 px-6">
          Start Tracking
        </Button>
        <Button variant="outline" onClick={() => navigate('/dashboard')} className="px-6">
          View Demo Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AuthPrompt;
