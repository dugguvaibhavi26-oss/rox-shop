import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, disabled, ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[#0F172A] flex items-center justify-between">
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
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full appearance-none bg-transparent px-3.5 py-2.5 pr-10 text-sm text-[#0F172A] focus:outline-none disabled:cursor-not-allowed",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 flex items-center text-[#64748B]">
            <ChevronDown className="h-4 w-4" />
          </div>
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
Select.displayName = "Select";

/**
 * Combobox: Searchable Dropdown with live filtering
 */
export interface ComboboxProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function Combobox({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left relative" ref={containerRef}>
      {label && <span className="text-sm font-medium text-[#0F172A]">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-sm min-h-[44px] transition-colors",
          error
            ? "border-[#B91C1C]"
            : isOpen
            ? "border-[#1E3A8A] ring-2 ring-[#1E3A8A]/10"
            : "border-[#CBD5E1] hover:border-[#94A3B8]",
          disabled && "bg-[#F8FAFC] opacity-60 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-[#94A3B8]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-[#64748B] transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-[#E2E8F0]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#1E3A8A]"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-xs text-center text-[#64748B]">No results found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange?.(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-left transition-colors",
                      isSelected ? "bg-[#EFF6FF] text-[#1E3A8A] font-semibold" : "text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#1E3A8A]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-[#B91C1C]">{error}</p>}
    </div>
  );
}
