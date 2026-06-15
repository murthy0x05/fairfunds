import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "coral" | "secondary" | "destructive" | "success" | "warning" | "outline";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants: Record<string, string> = {
    default: "bg-surface-card text-ink",
    coral: "bg-primary text-on-primary text-[12px] font-medium tracking-[1.5px] uppercase",
    secondary: "bg-surface-soft text-muted border border-hairline",
    destructive: "bg-error/10 text-error border border-error/20",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-accent-amber/10 text-accent-amber border border-accent-amber/20",
    outline: "bg-transparent text-muted border border-hairline",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-[13px] font-medium leading-5",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
