import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-button transition-colors-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted",
        secondary:
          "bg-canvas text-ink border border-hairline hover:bg-surface-soft active:bg-surface-card",
        "secondary-dark":
          "bg-surface-dark-elevated text-on-dark hover:bg-surface-dark-soft active:bg-surface-dark-soft",
        destructive:
          "bg-error text-on-primary hover:bg-error/90 active:bg-error/80",
        ghost:
          "text-muted hover:text-ink hover:bg-surface-soft active:bg-surface-card",
        link:
          "text-primary underline-offset-4 hover:underline active:text-primary-active",
        success:
          "bg-success text-white hover:bg-success/90",
      },
      size: {
        default: "h-10 px-5 py-3 rounded-md text-[14px]",
        sm: "h-8 px-3 py-2 rounded-md text-[13px]",
        lg: "h-11 px-6 py-3 rounded-md text-[15px]",
        icon: "h-9 w-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
