import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton for the timer circle
export const TimerCircleSkeleton: React.FC = () => (
  <div className="relative flex items-center justify-center">
    {/* Outer ring */}
    <div className="relative">
      <Skeleton className="h-48 w-48 md:h-56 md:w-56 rounded-full" />
      {/* Inner content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Skeleton className="h-10 w-24 mb-2" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// Skeleton for timer controls
export const TimerControlsSkeleton: React.FC = () => (
  <div className="flex items-center justify-center gap-4 mt-6">
    <Skeleton className="h-10 w-10 rounded-full" />
    <Skeleton className="h-14 w-14 rounded-full" />
    <Skeleton className="h-10 w-10 rounded-full" />
  </div>
);

// Skeleton for session dots
export const SessionDotsSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2 absolute -left-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-3 w-3 rounded-full" />
    ))}
  </div>
);

// Skeleton for timer stats
export const TimerStatsSkeleton: React.FC = () => (
  <Card className="mt-4">
    <CardContent className="py-4">
      <div className="flex justify-around">
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Skeleton for active task display
export const ActiveTaskSkeleton: React.FC = () => (
  <div className="text-center mt-4 space-y-2">
    <Skeleton className="h-3 w-16 mx-auto" />
    <Skeleton className="h-5 w-48 mx-auto" />
  </div>
);

// Skeleton for timer mode tabs
export const TimerModeTabsSkeleton: React.FC = () => (
  <div className="flex justify-center gap-2 mb-4">
    <Skeleton className="h-8 w-24 rounded-full" />
    <Skeleton className="h-8 w-24 rounded-full" />
  </div>
);

// Complete timer container skeleton
export const TimerContainerSkeleton: React.FC = () => (
  <div className="flex flex-col items-center animate-fade-in">
    <TimerModeTabsSkeleton />
    <div className="relative">
      <SessionDotsSkeleton />
      <TimerCircleSkeleton />
    </div>
    <TimerControlsSkeleton />
    <ActiveTaskSkeleton />
    <TimerStatsSkeleton />
  </div>
);

// Skeleton for the AI tutor chat panel
export const ChatPanelSkeleton: React.FC = () => (
  <div className="flex flex-col h-full animate-fade-in">
    {/* Header */}
    <div className="flex items-center justify-between pb-3 border-b">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    
    {/* Messages area */}
    <div className="flex-1 py-4 space-y-4">
      {/* AI message */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1 max-w-[80%]">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* User message */}
      <div className="flex gap-2 justify-end">
        <div className="space-y-2 max-w-[80%]">
          <Skeleton className="h-4 w-48 ml-auto" />
          <Skeleton className="h-4 w-32 ml-auto" />
        </div>
      </div>
      
      {/* AI message */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1 max-w-[80%]">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
    
    {/* Input area */}
    <div className="pt-3 border-t">
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  </div>
);

export default TimerContainerSkeleton;
