import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Reusable container for page skeletons
export const SkeletonPageContainer = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={cn("space-y-6", className)}
  >
    {children}
  </motion.div>
);

// Page Header Skeleton
export const SkeletonPageHeader = ({ hasActions = true }: { hasActions?: boolean }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" variant="shimmer" />
      <Skeleton className="h-4 w-72" variant="shimmer" />
    </div>
    {hasActions && (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" variant="shimmer" />
        <Skeleton className="h-10 w-32" variant="shimmer" />
      </div>
    )}
  </div>
);

// Stats Grid Skeleton
export const SkeletonStatsGrid = ({ count = 4 }: { count?: number }) => (
  <div className={cn(
    "grid gap-4",
    count <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  )}>
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <Skeleton className="h-8 w-16" variant="shimmer" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" variant="shimmer" />
          </div>
          <Skeleton className="h-3 w-32 mt-4" variant="shimmer" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Stat Card Skeleton (legacy support)
export const StatCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" variant="shimmer" />
          <Skeleton className="h-8 w-16" variant="shimmer" />
          <Skeleton className="h-3 w-20" variant="shimmer" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" variant="shimmer" />
      </div>
    </CardContent>
  </Card>
);

// Dashboard Stats Grid Skeleton (legacy support)
export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// Chart Card Skeleton
export const ChartCardSkeleton = ({ className }: { className?: string }) => (
  <Card className={className}>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" variant="shimmer" />
        <Skeleton className="h-4 w-20" variant="shimmer" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-end justify-around gap-2 pt-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton 
              className="w-full rounded-t-md" 
              // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
              style={{ height: `${Math.random() * 60 + 40}%` }} 
              variant="shimmer"
            />
            <Skeleton className="h-3 w-8" variant="shimmer" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Page loading wrapper
export const PageSkeleton = ({ children }: { children: React.ReactNode }) => (
  <div className="animate-fade-in">
    {children}
  </div>
);
