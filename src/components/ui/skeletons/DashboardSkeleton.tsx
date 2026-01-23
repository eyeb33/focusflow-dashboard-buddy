import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton for individual stat cards
export const StatCardSkeleton: React.FC = () => (
  <Card className="min-h-[120px]">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton for the stat cards grid (3 cards)
export const StatCardsGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
    <StatCardSkeleton />
    <StatCardSkeleton />
    <StatCardSkeleton />
  </div>
);

// Skeleton for charts
export const ChartSkeleton: React.FC = () => (
  <Card className="w-full">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
        {/* Simulate bar chart bars */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton 
              className="w-full rounded-t-md" 
              style={{ height: `${Math.random() * 60 + 40}%` }} 
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Skeleton for the streak calendar
export const CalendarSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-28" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-full" />
        ))}
        {/* Calendar days */}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    </CardContent>
  </Card>
);

// Skeleton for radial chart / daily focus pattern
export const RadialChartSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Skeleton for study streak with badges
export const StudyStreakSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-28" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Current streak display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      
      {/* Milestone badges */}
      <div className="pt-2 space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Complete dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Header area */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>

    {/* Stats cards */}
    <StatCardsGridSkeleton />

    {/* Study Streak */}
    <StudyStreakSkeleton />

    {/* Charts and Calendar */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
      <div className="lg:col-span-1">
        <CalendarSkeleton />
      </div>
    </div>

    {/* Radial chart */}
    <RadialChartSkeleton />
  </div>
);

export default DashboardSkeleton;
