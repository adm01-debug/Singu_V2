import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Contact Card Skeleton
export const ContactCardSkeleton = () => (
  <Card className="h-full overflow-hidden">
    <CardContent className="p-0">
      <Skeleton className="h-16 rounded-none" variant="shimmer" />
      <div className="relative">
        <div className="absolute -top-8 left-5">
          <Skeleton className="w-16 h-16 rounded-full border-4 border-card" variant="shimmer" />
        </div>
      </div>
      <div className="pt-10 px-5 pb-5 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" variant="shimmer" />
          <Skeleton className="h-4 w-24" variant="shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" variant="shimmer" />
          <Skeleton className="h-4 w-28" variant="shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-6 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" variant="shimmer" />
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          <div className="ml-auto">
            <Skeleton className="h-4 w-20" variant="shimmer" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Company Card Skeleton
export const CompanyCardSkeleton = React.forwardRef<HTMLDivElement>(function CompanyCardSkeleton(_, ref) {
  return (
    <Card className="h-full" ref={ref}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl" variant="shimmer" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" variant="shimmer" />
              <Skeleton className="h-4 w-20" variant="shimmer" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" variant="shimmer" />
            <Skeleton className="h-4 w-32" variant="shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" variant="shimmer" />
            <Skeleton className="h-4 w-28" variant="shimmer" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Skeleton className="h-4 w-12" variant="shimmer" />
          <Skeleton className="h-4 w-24" variant="shimmer" />
        </div>
      </CardContent>
    </Card>
  );
});

// Contacts Grid Skeleton
export const ContactsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <ContactCardSkeleton key={i} />
    ))}
  </div>
);

// Contacts List Skeleton
export const ContactsListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" variant="shimmer" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" variant="shimmer" />
                <Skeleton className="h-5 w-20 rounded-full" variant="shimmer" />
                <Skeleton className="h-5 w-5 rounded-full" variant="shimmer" />
              </div>
              <Skeleton className="h-4 w-48" variant="shimmer" />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1 text-right hidden sm:block">
                <Skeleton className="h-4 w-20" variant="shimmer" />
                <Skeleton className="h-3 w-16" variant="shimmer" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Companies Grid Skeleton
export const CompaniesGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <CompanyCardSkeleton key={i} />
    ))}
  </div>
);

// Dashboard Top Contacts Skeleton
export const TopContactsSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <Skeleton className="h-6 w-48" variant="shimmer" />
      <Skeleton className="h-8 w-24" variant="shimmer" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" variant="shimmer" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" variant="shimmer" />
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" variant="shimmer" />
                <Skeleton className="h-5 w-5 rounded-full" variant="shimmer" />
              </div>
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Insights Skeleton
export const InsightsSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between">
      <Skeleton className="h-6 w-40" variant="shimmer" />
      <Skeleton className="h-8 w-24" variant="shimmer" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-border">
          <div className="flex items-start justify-between mb-2">
            <Skeleton className="h-5 w-24 rounded-full" variant="shimmer" />
            <Skeleton className="h-4 w-20" variant="shimmer" />
          </div>
          <Skeleton className="h-5 w-full mb-2" variant="shimmer" />
          <Skeleton className="h-4 w-3/4" variant="shimmer" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// Activity Skeleton
export const ActivitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-40" variant="shimmer" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
          <Skeleton className="w-2 h-2 rounded-full" variant="shimmer" />
          <div className="flex-1 flex items-center justify-between">
            <Skeleton className="h-4 w-64" variant="shimmer" />
            <Skeleton className="h-4 w-24" variant="shimmer" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Interaction Card Skeleton
export const InteractionCardSkeleton = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" variant="shimmer" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" variant="shimmer" />
            <Skeleton className="h-4 w-24" variant="shimmer" />
          </div>
          <Skeleton className="h-4 w-32" variant="shimmer" />
        </div>
      </div>
      <Skeleton className="h-16 w-full rounded-md" variant="shimmer" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" variant="shimmer" />
        <Skeleton className="h-5 w-20 rounded-full" variant="shimmer" />
      </div>
    </CardContent>
  </Card>
);

// Interactions List Skeleton
export const InteractionsListSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <InteractionCardSkeleton key={i} />
    ))}
  </div>
);

// Detail Page Header Skeleton
export const DetailHeaderSkeleton = () => (
  <div className="flex items-start gap-6 mb-8">
    <Skeleton className="w-24 h-24 rounded-2xl" variant="shimmer" />
    <div className="flex-1 space-y-3">
      <Skeleton className="h-8 w-48" variant="shimmer" />
      <Skeleton className="h-5 w-32" variant="shimmer" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
        <Skeleton className="h-6 w-24 rounded-full" variant="shimmer" />
        <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
      </div>
    </div>
  </div>
);

// Calendar Skeleton
export const CalendarSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <div className="lg:col-span-3">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" variant="shimmer" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
            <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8 w-full rounded" variant="shimmer" />
          ))}
          {[...Array(35)].map((_, i) => (
            <Skeleton key={`day-${i}`} className="h-24 w-full rounded" variant="shimmer" />
          ))}
        </div>
      </Card>
    </div>
    <div>
      <Card className="p-4">
        <Skeleton className="h-6 w-32 mb-4" variant="shimmer" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/30 space-y-2">
              <Skeleton className="h-5 w-24" variant="shimmer" />
              <Skeleton className="h-4 w-full" variant="shimmer" />
              <Skeleton className="h-4 w-20" variant="shimmer" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
