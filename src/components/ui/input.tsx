import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, leftAddon, rightAddon, id, disabled, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#0F172A] flex items-center justify-between">
            <span>{label}</span>
            {props.required && <span className="text-xs text-[#B91C1C] font-normal">*required</span>}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center rounded-xl border bg-white transition-colors duration-150 min-h-[44px]",
            error
              ? "border-[#B91C1C] focus-within:ring-2 focus-within:ring-[#B91C1C]/20"
              : "border-[#CBD5E1] focus-within:border-[#1E3A8A] focus-within:ring-2 focus-within:ring-[#1E3A8A]/10",
            disabled && "bg-[#F8FAFC] opacity-60 cursor-not-allowed"
          )}
        >
          {leftAddon && <div className="pl-3.5 pr-2 flex items-center text-[#64748B] select-none text-sm font-medium">{leftAddon}</div>}
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              "w-full bg-transparent px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none disabled:cursor-not-allowed",
              leftAddon && "pl-0",
              rightAddon && "pr-0",
              className
            )}
            {...props}
          />
          {rightAddon && <div className="pr-3.5 pl-2 flex items-center text-[#64748B] select-none text-sm">{rightAddon}</div>}
        </div>
        {error ? (
          <p className="text-xs text-[#B91C1C] flex items-center gap-1 font-medium mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

/**
 * PhoneInput: Specialized for Indian 10-digit mobile numbers with +91 badge
 */
export interface PhoneInputProps extends Omit<InputProps, "leftAddon" | "type"> {}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ placeholder = "98765 43210", onChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
      e.target.value = raw;
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        onChange={handleChange}
        value={value}
        leftAddon={
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] border-r border-[#E2E8F0] pr-2.5">
            <span>🇮🇳</span>
            <span>+91</span>
          </span>
        }
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

/**
 * PinCodeInput: Specialized for Indian 6-digit postal PIN codes
 */
export interface PinCodeInputProps extends Omit<InputProps, "leftAddon" | "type"> {
  onLookupComplete?: (location: { city: string; state: string }) => void;
}

export const PinCodeInput = React.forwardRef<HTMLInputElement, PinCodeInputProps>(
  ({ placeholder = "560001", onChange, onLookupComplete, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
      e.target.value = val;
      onChange?.(e);
      if (val.length === 6 && onLookupComplete) {
        // Quick demo lookup helper
        onLookupComplete({ city: "Bengaluru", state: "Karnataka" });
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
PinCodeInput.displayName = "PinCodeInput";

/**
 * PriceInput: Specialized for Indian Rupees with fixed ₹ prefix
 */
export interface PriceInputProps extends Omit<InputProps, "leftAddon" | "type"> {}

export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ placeholder = "799", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/[^0-9.]/g, "");
      e.target.value = val;
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        onChange={handleChange}
        leftAddon={<span className="text-base font-semibold text-[#0F172A]">₹</span>}
        {...props}
      />
    );
  }
);
PriceInput.displayName = "PriceInput";

/**
 * SearchInput: Input with search icon and clear button
 */
export interface SearchInputProps extends Omit<InputProps, "leftAddon"> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = "Search products, orders...", value, onChange, onClear, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        leftAddon={<Search className="w-4 h-4 text-[#94A3B8]" />}
        rightAddon={
          value ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#0F172A] focus:outline-none"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null
        }
        {...props}
      />
    );
  }
);
SearchInput.displayName = "SearchInput";
