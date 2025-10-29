
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { LogOut, User } from 'lucide-react';
import ThemeToggle from '@/components/Theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/Theme/ThemeProvider';
import { cn } from '@/lib/utils';
import icon from '@/assets/icon.png';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onLoginClick,
  onSignupClick,
}) => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const handleLoginClick = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      navigate('/auth', { state: { mode: 'login' } });
    }
  };
  
  const handleSignupClick = () => {
    if (onSignupClick) {
      onSignupClick();
    } else {
      navigate('/auth', { state: { mode: 'signup' } });
    }
  };

  return (
    <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50">
      <div className="container px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-3 rounded-xl dark:bg-gray-950 transition-colors">
                <img src={icon} alt="TimeBubble" className="h-16 w-auto" />
              </div>
            </Link>
          </div>
          
          <nav className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button variant="ghost" size={isMobile ? "icon" : "default"}>
                    {isMobile ? (
                      <User className="h-5 w-5" />
                    ) : (
                      "Dashboard"
                    )}
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size={isMobile ? "icon" : "default"}
                  onClick={() => signOut()}
                >
                  {isMobile ? (
                    <LogOut className="h-5 w-5" />
                  ) : (
                    "Logout"
                  )}
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" onClick={handleLoginClick} size={isMobile ? "sm" : "default"}>
                  Login
                </Button>
                <Button variant="default" onClick={handleSignupClick} size={isMobile ? "sm" : "default"} className="bg-pomodoro-work hover:bg-pomodoro-work/90">
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
