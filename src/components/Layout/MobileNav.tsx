
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Timer, BarChart2, User, Settings } from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Timer, label: 'Timer' },
    { path: '/dashboard', icon: BarChart2, label: 'Stats' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-sm transition-colors",
              location.pathname === item.path
                ? "text-pomodoro-work"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
