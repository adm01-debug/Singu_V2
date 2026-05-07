import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "nexus-card rounded-2xl text-card-foreground transition-all duration-300 ease-smooth",
  {
    variants: {
      variant: {
        default: "bg-card/60 backdrop-blur-sm border border-border/30 shadow-soft hover:shadow-medium hover:border-border/60 hover:-translate-y-1",
        elevated: "bg-card border border-border/30 shadow-medium hover:shadow-strong hover:border-primary/20 hover:-translate-y-1",
        outlined: "bg-card border border-border/30 shadow-none hover:border-primary/40 hover:shadow-soft",
        ghost: "bg-transparent border-transparent shadow-none",
        glass: "bg-card/40 backdrop-blur-xl border border-white/10 shadow-lg hover:bg-card/60 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1",
        interactive: "bg-card border border-border/30 shadow-soft cursor-pointer hover:border-primary/30 hover:bg-muted/10 hover:shadow-medium active:scale-[0.98] hover:-translate-y-1",
        muted: "bg-muted/20 border border-border/30 shadow-none",
        success: "bg-success/5 border border-success/20 shadow-none hover:border-success/40",
        warning: "bg-warning/5 border border-warning/20 shadow-none hover:border-warning/40",
        destructive: "bg-destructive/5 border border-destructive/20 shadow-none hover:border-destructive/40",
      },
      padding: {
        none: "",
        sm: "[&>*:not(.card-header):not(.card-footer)]:p-4",
        default: "",
        lg: "[&>*:not(.card-header):not(.card-footer)]:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-header flex flex-col space-y-2 p-6 md:p-8", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-heading font-bold leading-tight tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground font-light tracking-tight", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0 md:p-8 md:pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-footer flex items-center p-6 pt-0 md:p-8 md:pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
