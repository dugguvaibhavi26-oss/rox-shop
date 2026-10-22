import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral" | "primary";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    neutral: "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    primary: "bg-[#EFF6FF] text-[#1E3A8A] border-[#BFDBFE]",
    success: "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]",
    warning: "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]",
    error: "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]",
    info: "bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      <span>{children}</span>
    </span>
  );
}
