import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight ring-offset-background transition-all duration-300 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-medium",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-destructive shadow-soft",
        outline: "border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:bg-primary/5 hover:text-foreground hover:shadow-soft",
        secondary: "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 border border-secondary/20",
        ghost: "hover:bg-muted/30 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gradient: "nexus-gradient-bg text-primary-foreground hover:opacity-90 shadow-medium relative overflow-hidden",
        "gradient-success": "bg-gradient-to-br from-success to-nexus-emerald text-success-foreground hover:opacity-90 focus-success shadow-medium",
        "gradient-warning": "bg-gradient-to-br from-warning to-nexus-amber text-warning-foreground hover:opacity-90 focus-warning shadow-medium",
        premium: "bg-gradient-to-br from-primary via-nexus-cyan to-nexus-emerald text-primary-foreground hover:opacity-90 shadow-lg premium-glow-effect",
        success: "bg-success text-success-foreground hover:bg-success/90 focus-success shadow-soft",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-soft",
        info: "bg-info text-info-foreground hover:bg-info/90 shadow-soft",
        glass: "bg-card/40 backdrop-blur-xl border border-white/10 text-foreground hover:bg-card/60 hover:border-primary/40 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xs: "h-7 px-2 text-xs rounded",
        xl: "h-12 px-10 text-lg rounded-lg",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<"button">>,
    HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

