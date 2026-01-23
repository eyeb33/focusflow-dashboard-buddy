import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Award, Medal, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MilestoneBadge {
  name: string;
  days: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  achieved: boolean;
}

interface StudyStreakProps {
  currentStreak: number;
  bestStreak: number;
  className?: string;
}

const StudyStreak: React.FC<StudyStreakProps> = ({
  currentStreak,
  bestStreak,
  className
}) => {
  // Define milestone badges
  const milestones: MilestoneBadge[] = [
    {
      name: 'Bronze',
      days: 7,
      icon: <Medal className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      achieved: bestStreak >= 7
    },
    {
      name: 'Silver',
      days: 30,
      icon: <Award className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'text-slate-500',
      bgColor: 'bg-slate-100 dark:bg-slate-800/50',
      achieved: bestStreak >= 30
    },
    {
      name: 'Gold',
      days: 100,
      icon: <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      achieved: bestStreak >= 100
    }
  ];

  // Calculate progress to next milestone
  const getNextMilestone = () => {
    if (currentStreak < 7) return { target: 7, name: 'Bronze', remaining: 7 - currentStreak };
    if (currentStreak < 30) return { target: 30, name: 'Silver', remaining: 30 - currentStreak };
    if (currentStreak < 100) return { target: 100, name: 'Gold', remaining: 100 - currentStreak };
    return null;
  };

  const nextMilestone = getNextMilestone();
  const progressPercent = nextMilestone 
    ? ((currentStreak / nextMilestone.target) * 100).toFixed(0)
    : 100;

  // Determine streak status message
  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "Great start! Keep it going!";
    if (currentStreak < 7) return `${7 - currentStreak} days to Bronze badge!`;
    if (currentStreak < 30) return `${30 - currentStreak} days to Silver badge!`;
    if (currentStreak < 100) return `${100 - currentStreak} days to Gold badge!`;
    return "🏆 Legendary status achieved!";
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Study Streak
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        {/* Current Streak Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn(
                "h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-orange-400 to-red-500",
                currentStreak > 0 && "animate-pulse"
              )}>
                <span className="text-xl sm:text-2xl">🔥</span>
              </div>
              {currentStreak >= 7 && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                  <Star className="h-3 w-3 text-yellow-800 fill-yellow-800" />
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold tabular-nums">
                {currentStreak}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentStreak === 1 ? 'day streak' : 'days streak'}
              </p>
            </div>
          </div>
          
          {/* Best Streak */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs sm:text-sm">Best</span>
            </div>
            <p className="text-lg sm:text-xl font-semibold">{bestStreak} days</p>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">{getStreakMessage()}</span>
              <span className="font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Milestone Badges */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">Milestone Badges</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {milestones.map((milestone) => (
              <div
                key={milestone.name}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-lg transition-all",
                  milestone.achieved 
                    ? `${milestone.bgColor} ${milestone.color} ring-2 ring-current/20` 
                    : "bg-muted/50 text-muted-foreground opacity-50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full",
                  milestone.achieved ? milestone.bgColor : "bg-muted"
                )}>
                  {milestone.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium">{milestone.name}</span>
                <span className="text-[10px] sm:text-xs opacity-75">{milestone.days} days</span>
                {milestone.achieved && (
                  <span className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ Earned
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Motivational Message for New Users */}
        {currentStreak === 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
            <p className="text-xs sm:text-sm text-primary">
              Complete a Pomodoro session today to start your streak! 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyStreak;
