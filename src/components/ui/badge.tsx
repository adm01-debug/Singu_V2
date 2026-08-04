import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80",
        muted: "border-transparent bg-muted text-muted-foreground",
        gradient: "border-0 bg-gradient-to-r from-primary to-accent text-primary-foreground",
        glass: "border-border/50 bg-background/50 backdrop-blur-sm text-foreground",
        premium: "border-0 bg-gradient-to-r from-warning to-accent text-primary-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
  dot?: boolean;
  dotColor?: string;
  animated?: boolean;
  pulse?: boolean;
  closeable?: boolean;
  onClose?: () => void;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(function Badge({
  className,
  variant,
  size,
  icon,
  dot,
  dotColor = "bg-current",
  animated,
  pulse,
  closeable,
  onClose,
  children,
  ...props
}, ref) {
  const content = (
    <>
      {dot && (
        <span className={cn("relative flex h-2 w-2", pulse && "animate-pulse")}>
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              dotColor,
              pulse && "animate-ping"
            )}
          />
          <span className={cn("relative inline-flex h-2 w-2 rounded-full", dotColor)} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {closeable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </>
  );

  if (animated) {
    // Extract only valid HTML div attributes for motion.div
    const { onClick, onMouseEnter, onMouseLeave, role, tabIndex, 'aria-label': ariaLabel } = props;
    const motionProps = { onClick, onMouseEnter, onMouseLeave, role, tabIndex, 'aria-label': ariaLabel };

    return (
      <motion.div
        ref={ref}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        whileHover={{ scale: 1.05 }}
        className={cn(badgeVariants({ variant, size }), className)}
        {...motionProps}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {content}
    </div>
  );
});

Badge.displayName = "Badge";

// Badge Group with truncation
interface BadgeGroupProps {
  badges: Array<{ id: string; label: string; variant?: BadgeProps["variant"] }>;
  max?: number;
  size?: BadgeProps["size"];
  className?: string;
}

function BadgeGroup({ badges, max = 3, size = "default", className }: BadgeGroupProps) {
  const visible = badges.slice(0, max);
  const remaining = badges.length - max;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <AnimatePresence mode="popLayout">
        {visible.map((badge) => (
          <Badge key={badge.id} variant={badge.variant} size={size} animated>
            {badge.label}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="muted" size={size}>
            +{remaining}
          </Badge>
        )}
      </AnimatePresence>
    </div>
  );
}

// Status Badge with built-in colors
type StatusType = "online" | "offline" | "away" | "busy" | "pending" | "active" | "inactive";

interface StatusBadgeProps extends Omit<BadgeProps, "variant" | "dot" | "dotColor"> {
  status: StatusType;
  showDot?: boolean;
}

const statusConfig: Record<StatusType, { variant: BadgeProps["variant"]; dotColor: string; label: string }> = {
  online: { variant: "success", dotColor: "bg-success", label: "Online" },
  offline: { variant: "muted", dotColor: "bg-muted-foreground", label: "Offline" },
  away: { variant: "warning", dotColor: "bg-warning", label: "Ausente" },
  busy: { variant: "destructive", dotColor: "bg-destructive", label: "Ocupado" },
  pending: { variant: "warning", dotColor: "bg-warning", label: "Pendente" },
  active: { variant: "success", dotColor: "bg-success", label: "Ativo" },
  inactive: { variant: "muted", dotColor: "bg-muted-foreground", label: "Inativo" },
};

function StatusBadge({ status, showDot = true, children, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot={showDot} dotColor={config.dotColor} pulse={status === "pending"} {...props}>
      {children || config.label}
    </Badge>
  );
}

// New/Updated Badge with animation
interface NotificationBadgeProps extends Omit<BadgeProps, "animated"> {
  isNew?: boolean;
}

function NotificationBadge({ isNew, children, ...props }: NotificationBadgeProps) {
  return (
    <Badge
      variant={isNew ? "destructive" : "secondary"}
      animated
      pulse={isNew}
      {...props}
    >
      {isNew && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
      {children}
    </Badge>
  );
}

export { Badge, BadgeGroup, StatusBadge, NotificationBadge, badgeVariants };
