import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full-page loading fallback shown during lazy route loading.
 * Renders a skeleton layout that mimics the typical page structure
 * to reduce perceived loading time and layout shift.
 */
export function PageLoadingFallback() {
  const sidebarItemWidths = ['w-28', 'w-24', 'w-20', 'w-24', 'w-16'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_22%),radial-gradient(circle_at_top_left,hsl(var(--accent)/0.12),transparent_20%),hsl(var(--background))] p-3 md:p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-4">
        <aside className="hidden md:flex w-[280px] shrink-0 flex-col rounded-[28px] border border-sidebar-border/80 bg-[linear-gradient(180deg,hsl(var(--sidebar-background))_0%,hsl(var(--surface-0))_100%)] p-4 shadow-[0_24px_72px_-48px_hsl(var(--foreground)/0.92)]">
          <div className="flex items-center gap-3 border-b border-sidebar-border/80 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl nexus-gradient-bg shadow-[0_18px_40px_-20px_hsl(var(--nexus-glow)/0.7)]">
              <div className="h-4 w-4 rounded-full bg-primary-foreground/80" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          <div className="pt-4">
            <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3">
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          <div className="mt-6 flex-1 space-y-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-16" />
              <div className="space-y-2">
                {sidebarItemWidths.map((width, index) => (
                  <div
                    key={`nav-primary-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-transparent bg-sidebar-accent/15 px-3 py-3"
                  >
                    <Skeleton className="h-5 w-5 rounded-lg" />
                    <Skeleton className={`h-4 ${width}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-3 w-14" />
              <div className="space-y-2">
                {['w-20', 'w-24', 'w-20'].map((width, index) => (
                  <div
                    key={`nav-secondary-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-transparent bg-sidebar-accent/10 px-3 py-3"
                  >
                    <Skeleton className="h-5 w-5 rounded-lg" />
                    <Skeleton className={`h-4 ${width}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-sidebar-border/80 pt-4">
            <div className="flex items-center gap-3 rounded-2xl bg-sidebar-accent/20 p-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-4 md:space-y-5">
          <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--surface-1))_100%)] p-4 shadow-[0_24px_72px_-48px_hsl(var(--foreground)/0.9)] md:p-5">
            <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <Skeleton className="h-4 w-4 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40 md:w-52" />
                  <Skeleton className="h-4 w-28 md:w-40" />
                </div>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <Skeleton className="h-9 w-24 rounded-2xl" />
                <Skeleton className="h-9 w-9 rounded-2xl" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
              <div className="overflow-hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--surface-2))_55%,hsl(var(--surface-3))_100%)] p-5 shadow-[0_28px_72px_-46px_hsl(var(--primary)/0.45)] md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-[24px]" />
                    <div className="space-y-3">
                      <Skeleton className="h-9 w-48 md:w-72" />
                      <Skeleton className="h-4 w-28 md:w-40" />
                    </div>
                  </div>
                  <Skeleton className="hidden h-11 w-32 rounded-2xl md:block" />
                </div>
              </div>

              <div className="rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--surface-1))_100%)] p-5 shadow-[0_24px_72px_-48px_hsl(var(--foreground)/0.9)]">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-10 w-full rounded-2xl" />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-4">
                <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_24px_72px_-48px_hsl(var(--foreground)/0.9)]">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-8 w-28 rounded-2xl" />
                  </div>
                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <Skeleton className="h-56 rounded-[24px]" />
                    <Skeleton className="h-56 rounded-[24px]" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`metric-${index}`}
                      className="rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--surface-1))_100%)] p-5 shadow-[0_24px_72px_-48px_hsl(var(--foreground)/0.9)]"
                    >
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`rail-card-${index}`}
                    className="rounded-[24px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card))_0%,hsl(var(--surface-1))_100%)] p-5 shadow-[0_24px_72px_-48px_hsl(var(--foreground)/0.9)]"
                  >
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-24 w-full rounded-[20px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
