import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] shadow-xs overflow-hidden",
          hoverable && "transition-all duration-200 hover:shadow-md hover:border-[#CBD5E1] cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex items-start justify-between p-5 border-b border-[#F1F5F9]", className)}
      {...props}
    >
      <div className="flex flex-col text-left">
        {title && <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>}
        {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between p-4 bg-[#F8FAFC] border-t border-[#F1F5F9]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
