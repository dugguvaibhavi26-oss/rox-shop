import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#1E3A8A] text-white hover:bg-[#1E40AF] focus-visible:ring-[#1E3A8A] shadow-sm",
      secondary:
        "bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] focus-visible:ring-[#64748B]",
      outline:
        "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] focus-visible:ring-[#1E3A8A]",
      ghost:
        "text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:ring-[#64748B]",
      destructive:
        "bg-[#B91C1C] text-white hover:bg-[#991B1B] focus-visible:ring-[#B91C1C] shadow-sm",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs gap-1.5",
      md: "min-h-[44px] h-11 px-4 text-sm gap-2", // 44px touch target on mobile
      lg: "min-h-[48px] h-12 px-6 text-base gap-2.5",
      icon: "h-11 w-11 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
