
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Moon, Sun, User } from 'lucide-react';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isAuthenticated = false,
  onLoginClick,
  onSignupClick,
  onToggleTheme,
  isDarkMode = false
}) => {
  const isMobile = useIsMobile();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-pomodoro-work flex items-center justify-center">
              <span className="text-white font-semibold text-sm">F</span>
            </div>
            {!isMobile && <span className="text-lg font-semibold">FocusFlow</span>}
          </Link>
        </div>
        
        <nav className="flex items-center gap-2 md:gap-4">
          {onToggleTheme && (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleTheme}>
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}
          
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="ghost" size={isMobile ? "icon" : "default"}>
                {isMobile ? (
                  <User className="h-5 w-5" />
                ) : (
                  "Dashboard"
                )}
              </Button>
            </Link>
          ) : (
            <>
              {onLoginClick && (
                <Button variant="ghost" onClick={onLoginClick} size={isMobile ? "sm" : "default"}>
                  Login
                </Button>
              )}
              {onSignupClick && (
                <Button variant="default" onClick={onSignupClick} size={isMobile ? "sm" : "default"} className="bg-pomodoro-work hover:bg-pomodoro-work/90">
                  Sign Up
                </Button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
