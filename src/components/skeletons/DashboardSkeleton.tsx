import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Progressive Dashboard Skeleton — mirrors real layout:
 * Phase 0: Welcome Hero + Stats Grid (instant)
 * Phase 1: Your Day section (120ms)
 * Phase 2: Activity + Top Contacts (250ms)
 */
const DashboardSkeleton = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 120);
    const t2 = setTimeout(() => setPhase(2), 250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div ref={ref} className="p-4 md:p-6 space-y-5 md:space-y-6">
      {/* Phase 0 — Welcome Hero (compact) */}
      <div className="animate-fade-in rounded-2xl border border-primary/15 bg-card/60 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3 md:gap-5">
          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-6 md:h-7 w-56" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <Skeleton className="hidden md:block h-10 w-28 rounded-2xl" />
        </div>
      </div>

      {/* Phase 0 — Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-fade-in">
        {['Empresas', 'Contatos', 'Interações', 'Score'].map((label, i) => (
          <Card key={`stats-${i}`} className="overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-[3px] skeleton-progressive rounded-t-[inherit]" />
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phase 1 — Your Day (120ms) */}
      {phase >= 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
          {/* Overdue */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Needs Attention */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase 2 — Activity + Top Contacts (250ms) */}
      {phase >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});
DashboardSkeleton.displayName = 'DashboardSkeleton';

export default DashboardSkeleton;
