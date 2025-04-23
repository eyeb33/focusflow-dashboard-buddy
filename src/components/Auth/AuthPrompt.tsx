
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthPromptProps {
  onSignupClick: () => void;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({ onSignupClick }) => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-xl text-center mt-8 px-4">
      <h2 className="text-xl font-semibold mb-2">Track your productivity</h2>
      <p className="text-muted-foreground mb-6">
        Sign up to track your progress, analyze your productivity patterns, and improve your focus habits over time.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Button onClick={onSignupClick} className="bg-pomodoro-work hover:bg-pomodoro-work/90">
          Start Tracking
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard?demo=1')}
        >
          View Demo Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AuthPrompt;
