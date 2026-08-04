import * as React from 'react';
import { Skeleton, SkeletonText, SkeletonAvatar } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SkeletonPageContainer, SkeletonPageHeader, SkeletonStatsGrid } from './SkeletonPrimitives';
import { ContactCardSkeleton } from './EntitySkeletons';

// Contacts Page Skeleton
export const ContactsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    <div className="flex flex-wrap items-center gap-2">
      <Skeleton className="h-10 w-64" variant="shimmer" />
      <Skeleton className="h-10 w-32" variant="shimmer" />
      <Skeleton className="h-10 w-32" variant="shimmer" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ContactCardSkeleton key={i} />
      ))}
    </div>
  </SkeletonPageContainer>
);

// Companies Page Skeleton
export const CompaniesPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    <SkeletonStatsGrid count={3} />
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" variant="shimmer" />
          <Skeleton className="h-10 w-40" variant="shimmer" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-xl" variant="shimmer" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" variant="shimmer" />
                <Skeleton className="h-4 w-32" variant="shimmer" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
                <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </SkeletonPageContainer>
);

// Interactions Page Skeleton
export const InteractionsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
                {i < 5 && <Skeleton className="h-16 w-0.5 mt-2" variant="shimmer" />}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SkeletonAvatar size="sm" />
                    <Skeleton className="h-5 w-32" variant="shimmer" />
                  </div>
                  <Skeleton className="h-4 w-24" variant="shimmer" />
                </div>
                <Skeleton className="h-4 w-full" variant="shimmer" />
                <Skeleton className="h-4 w-3/4" variant="shimmer" />
                <div className="flex items-center gap-2 pt-2">
                  <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
                  <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </SkeletonPageContainer>
);

// Analytics Page Skeleton
export const AnalyticsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader hasActions={false} />
    <SkeletonStatsGrid count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" variant="shimmer" />
              <Skeleton className="h-8 w-24" variant="shimmer" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg" variant="shimmer" />
          </CardContent>
        </Card>
      ))}
    </div>
  </SkeletonPageContainer>
);

// Insights Page Skeleton
export const InsightsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader hasActions={false} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" variant="shimmer" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" variant="shimmer" />
                  <SkeletonText lines={2} />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-8 w-24" variant="shimmer" />
                    <Skeleton className="h-8 w-20" variant="shimmer" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonAvatar size="sm" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full" variant="shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </SkeletonPageContainer>
);

// Calendar Page Skeleton
export const CalendarPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10" variant="shimmer" />
              <Skeleton className="h-6 w-40" variant="shimmer" />
              <Skeleton className="h-10 w-10" variant="shimmer" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" variant="shimmer" />
              <Skeleton className="h-10 w-24" variant="shimmer" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={`header-${i}`} className="bg-muted p-2">
                <Skeleton className="h-4 w-8 mx-auto" variant="shimmer" />
              </div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="bg-card p-2 min-h-24">
                <Skeleton className="h-5 w-5 mb-2" variant="shimmer" />
                {i % 5 === 0 && <Skeleton className="h-4 w-full rounded" variant="shimmer" />}
                {i % 7 === 3 && <Skeleton className="h-4 w-3/4 rounded mt-1" variant="shimmer" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Skeleton className="h-8 w-8 rounded" variant="shimmer" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" variant="shimmer" />
                    <Skeleton className="h-3 w-20" variant="shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </SkeletonPageContainer>
);

// Settings Page Skeleton
export const SettingsPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader hasActions={false} />
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" variant="shimmer" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <Skeleton className="h-6 w-48" variant="shimmer" />
          <Skeleton className="h-4 w-72" variant="shimmer" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" variant="shimmer" />
              <Skeleton className="h-10 w-full" variant="shimmer" />
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Skeleton className="h-10 w-32" variant="shimmer" />
          </div>
        </CardContent>
      </Card>
    </div>
  </SkeletonPageContainer>
);

// Network Page Skeleton
export const NetworkPageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" variant="shimmer" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" variant="shimmer" />
            <Skeleton className="h-10 w-10" variant="shimmer" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[500px] rounded-lg bg-muted/50 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  <Skeleton className="h-12 w-12 rounded-full" variant="pulse" />
                </div>
              );
            })}
            <Skeleton className="h-16 w-16 rounded-full" variant="pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  </SkeletonPageContainer>
);

// Contact Detail Skeleton
export const ContactDetailSkeleton = () => (
  <SkeletonPageContainer>
    <div className="flex items-start gap-6">
      <Skeleton className="h-24 w-24 rounded-2xl shrink-0" variant="shimmer" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-8 w-64" variant="shimmer" />
        <Skeleton className="h-5 w-48" variant="shimmer" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-24 rounded-full" variant="shimmer" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10" variant="shimmer" />
        <Skeleton className="h-10 w-32" variant="shimmer" />
      </div>
    </div>
    <div className="flex items-center gap-4 border-b pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24" variant="shimmer" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" variant="shimmer" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" variant="shimmer" />
                    <Skeleton className="h-3 w-1/2" variant="shimmer" />
                  </div>
                  <Skeleton className="h-4 w-20" variant="shimmer" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" variant="shimmer" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" variant="shimmer" />
                <Skeleton className="h-4 w-32" variant="shimmer" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" variant="shimmer" />
          </CardHeader>
          <CardContent>
            <SkeletonText lines={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  </SkeletonPageContainer>
);

// Pipeline (Kanban) Skeleton — imita as colunas reais do funil
export const PipelinePageSkeleton = () => (
  <SkeletonPageContainer>
    <SkeletonPageHeader />
    <SkeletonStatsGrid count={4} />
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, colIdx) => (
        <div key={colIdx} className="shrink-0 w-[280px] space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <Skeleton className="h-4 w-24" variant="shimmer" />
            <Skeleton className="h-5 w-8 rounded-full" variant="shimmer" />
          </div>
          {Array.from({ length: 3 - (colIdx % 2) }).map((_, cardIdx) => (
            <Card key={cardIdx} className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" variant="shimmer" />
              <Skeleton className="h-3 w-1/2" variant="shimmer" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-16 rounded-full" variant="shimmer" />
                <SkeletonAvatar size="sm" />
              </div>
            </Card>
          ))}
        </div>
      ))}
    </div>
  </SkeletonPageContainer>
);

// Detalhe de entidade (Empresa/Contato) — header + tabs + duas colunas
export const EntityDetailPageSkeleton = () => (
  <SkeletonPageContainer>
    <div className="flex items-start gap-4">
      <Skeleton className="h-20 w-20 rounded-2xl" variant="shimmer" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-64" variant="shimmer" />
        <Skeleton className="h-4 w-40" variant="shimmer" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" variant="shimmer" />
          <Skeleton className="h-6 w-20 rounded-full" variant="shimmer" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" variant="shimmer" />
        <Skeleton className="h-9 w-9 rounded-md" variant="shimmer" />
      </div>
    </div>
    <div className="flex gap-2 border-b">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24" variant="shimmer" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <Card><CardContent className="p-4"><SkeletonText lines={5} /></CardContent></Card>
        <Card><CardContent className="p-4"><SkeletonText lines={4} /></CardContent></Card>
      </div>
      <div className="space-y-4">
        <Card><CardContent className="p-4"><SkeletonText lines={3} /></CardContent></Card>
        <Card><CardContent className="p-4"><SkeletonText lines={3} /></CardContent></Card>
      </div>
    </div>
  </SkeletonPageContainer>
);
