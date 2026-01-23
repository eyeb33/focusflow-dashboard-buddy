import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton for a single topic item
export const TopicItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
    <Skeleton className="h-4 w-4 rounded" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-6 w-12 rounded-full" />
  </div>
);

// Skeleton for a category section
export const CategorySkeleton: React.FC = () => (
  <div className="space-y-2">
    {/* Category header */}
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    
    {/* Topics within category */}
    <div className="pl-4 space-y-2">
      <TopicItemSkeleton />
      <TopicItemSkeleton />
      <TopicItemSkeleton />
    </div>
  </div>
);

// Skeleton for the curriculum topic list
export const CurriculumTopicListSkeleton: React.FC = () => (
  <div className="space-y-4 animate-fade-in">
    <CategorySkeleton />
    <CategorySkeleton />
    <CategorySkeleton />
  </div>
);

// Skeleton for document upload card
export const DocumentUploadSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <div className="border-2 border-dashed border-muted rounded-lg p-8 flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </CardContent>
  </Card>
);

// Skeleton for document list
export const DocumentListSkeleton: React.FC = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-36" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Complete curriculum page skeleton
export const CurriculumPageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="mb-6">
      <Skeleton className="h-8 w-20 mb-4" />
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Upload card */}
    <DocumentUploadSkeleton />
    
    {/* Document list */}
    <DocumentListSkeleton />
  </div>
);

export default CurriculumTopicListSkeleton;
