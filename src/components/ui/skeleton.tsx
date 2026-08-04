import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Animation variant */
  variant?: "shimmer" | "pulse" | "wave";
  /** Rounded corners preset */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton({ 
  className, 
  variant = "shimmer",
  rounded = "md",
  ...props 
}, ref) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  const variantClasses = {
    shimmer: [
      "relative isolate overflow-hidden bg-muted/70",
      "before:absolute before:inset-0",
      "before:-translate-x-full",
      "before:animate-[shimmer_2s_infinite]",
      "before:bg-gradient-to-r",
      "before:from-transparent before:via-primary/10 before:to-transparent",
      "dark:before:via-primary/20",
    ].join(" "),
    pulse: "animate-pulse bg-muted/70",
    wave: [
      "relative overflow-hidden bg-muted/70",
      "after:absolute after:inset-0",
      "after:animate-[wave_1.5s_ease-in-out_infinite]",
      "after:bg-gradient-to-r after:from-transparent after:via-primary/5 after:to-transparent",
    ].join(" "),
  };

  return (
    <div
      ref={ref}
      className={cn(
        variantClasses[variant],
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  );
});

Skeleton.displayName = "Skeleton";

// Text skeleton with realistic line widths
function SkeletonText({ 
  lines = 3, 
  className,
  ...props 
}: { lines?: number } & React.HTMLAttributes<HTMLDivElement>) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-3/4", "w-2/3", "w-1/2"];
  
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", widths[i % widths.length])} 
        />
      ))}
    </div>
  );
}

// Avatar skeleton
function SkeletonAvatar({ 
  size = "md",
  className,
  ...props 
}: { size?: "sm" | "md" | "lg" | "xl" } & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <Skeleton 
      className={cn(sizeClasses[size], className)} 
      rounded="full"
      {...props}
    />
  );
}

// Button skeleton
function SkeletonButton({
  size = "default",
  className,
  ...props
}: { size?: "sm" | "default" | "lg" } & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    sm: "h-9 w-20",
    default: "h-10 w-24",
    lg: "h-11 w-28",
  };

  return (
    <Skeleton 
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  );
}

// Card skeleton matching real card structure
function SkeletonCard({
  hasHeader = true,
  hasFooter = false,
  className,
  ...props
}: { 
  hasHeader?: boolean;
  hasFooter?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)} {...props}>
      {hasHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8" rounded="lg" />
        </div>
      )}
      <SkeletonText lines={3} />
      {hasFooter && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Skeleton className="h-4 w-20" />
          <SkeletonButton size="sm" />
        </div>
      )}
    </div>
  );
}

// Table row skeleton
function SkeletonTableRow({
  columns = 4,
  className,
  ...props
}: { columns?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)} {...props}>
      <SkeletonAvatar size="sm" />
      <div className="flex-1 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns - 1}, 1fr)` }}>
        {Array.from({ length: columns - 1 }).map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
    </div>
  );
}

// Input skeleton
function SkeletonInput({
  hasLabel = true,
  className,
  ...props
}: { hasLabel?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {hasLabel && <Skeleton className="h-4 w-20" />}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard, 
  SkeletonTableRow,
  SkeletonInput
};
