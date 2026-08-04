import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "nexus-card rounded-lg text-card-foreground transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-card border border-border/60 shadow-none hover:border-border",
        elevated: "bg-card border border-border/60 shadow-none hover:border-border",
        outlined: "bg-card border border-border/60 shadow-none hover:border-primary/40",
        ghost: "bg-transparent border-transparent shadow-none",
        glass: "bg-card/80 border border-border/60 shadow-none hover:border-border",
        interactive: "bg-card border border-border/60 shadow-none cursor-pointer hover:border-border hover:bg-muted/20 active:scale-[0.99]",
        muted: "bg-muted/30 border border-border/60 shadow-none",
        success: "bg-success/8 border border-success/25 shadow-none hover:border-success/45",
        warning: "bg-warning/8 border border-warning/25 shadow-none hover:border-warning/45",
        destructive: "bg-destructive/8 border border-destructive/25 shadow-none hover:border-destructive/45",
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
    <div ref={ref} className={cn("card-header flex flex-col space-y-1.5 p-5 md:p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 pt-0 md:p-6 md:pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-footer flex items-center p-5 pt-0 md:p-6 md:pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
