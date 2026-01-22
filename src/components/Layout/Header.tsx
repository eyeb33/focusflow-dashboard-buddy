
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { LogOut, User, Bot, LayoutDashboard, BookOpen } from 'lucide-react';
import ThemeToggle from '@/components/Theme/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/Theme/ThemeProvider';
import { cn } from '@/lib/utils';
import syllabuddyLogoLight from '@/assets/syllabuddy-logo-light.png';
import syllabuddyLogoDark from '@/assets/syllabuddy-logo-dark.png';

const Header: React.FC = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  
  // Admin user ID for curriculum access
  const ADMIN_USER_ID = '9d326b17-8987-4a2f-a104-0ef900b6c382';
  const isAdmin = user?.id === ADMIN_USER_ID;
  
  const isOnDashboard = location.pathname === '/dashboard';
  const isOnTimer = location.pathname === '/';
  const isOnCurriculum = location.pathname === '/curriculum';

  return (
    <header className="border-b border-border/50 backdrop-blur-md bg-background/80 sticky top-0 z-50 pb-2.5">
      <div className="w-full px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center -ml-2">
              <img 
                src={theme === 'dark' ? syllabuddyLogoDark : syllabuddyLogoLight} 
                alt="Syllabuddy" 
                className="h-20 w-auto" 
              />
            </Link>
          </div>
          
          <nav className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            
            {user ? (
              <div className="flex items-center gap-2">
                {/* Page Toggle */}
                <div className="flex items-center bg-muted rounded-full p-1">
                  <Link to="/">
                    <button
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                        isOnTimer 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isMobile ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <>
                          <Bot className="h-4 w-4" />
                          Buddy
                        </>
                      )}
                    </button>
                  </Link>
                  <Link to="/dashboard">
                    <button
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                        isOnDashboard 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isMobile ? (
                        <LayoutDashboard className="h-4 w-4" />
                      ) : (
                        <>
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </>
                      )}
                    </button>
                  </Link>
                  {isAdmin && (
                    <Link to="/curriculum">
                      <button
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                          isOnCurriculum 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Curriculum Manager"
                      >
                        {isMobile ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4" />
                            Curriculum
                          </>
                        )}
                      </button>
                    </Link>
                  )}
                </div>
                
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
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
