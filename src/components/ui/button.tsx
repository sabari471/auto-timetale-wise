import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-professional hover:shadow-professional-lg hover:scale-105 active:scale-95 btn-press",
        destructive: "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground shadow-professional hover:shadow-professional-lg hover:scale-105 active:scale-95 btn-press",
        outline: "border-2 border-border bg-background hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 hover:border-primary/50 hover:shadow-professional hover:scale-105 active:scale-95 btn-press",
        secondary: "bg-gradient-secondary text-secondary-foreground shadow-professional hover:shadow-professional-lg hover:scale-105 active:scale-95 btn-press",
        accent: "bg-gradient-accent text-accent-foreground shadow-professional hover:shadow-professional-lg hover:scale-105 active:scale-95 btn-press",
        success: "bg-gradient-to-r from-success to-success/80 text-success-foreground shadow-professional hover:shadow-professional-lg hover:scale-105 active:scale-95 btn-press",
        ghost: "hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:text-accent-foreground hover:shadow-professional hover:scale-105 active:scale-95 btn-press",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        hero: "bg-gradient-hero text-primary-foreground shadow-professional-lg hover:shadow-xl hover:scale-110 active:scale-95 btn-press font-bold animate-pulse-glow",
        glass: "bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 hover:border-primary/30 hover:shadow-professional hover:scale-105 active:scale-95 btn-press",
      },
      size: {
        default: "h-12 px-8 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-10 text-base",
        xl: "h-16 rounded-2xl px-12 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        {...props}
      >
        {/* Shimmer effect overlay */}
        <span className="absolute inset-0 -top-px -left-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300" />
        {props.children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
