import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = "pill", className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar py-1 text-sm font-medium",
        variant === "pill" && "p-1 bg-[#F1F5F9] rounded-xl",
        variant === "underline" && "border-b border-[#E2E8F0] gap-4",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-sm transition-all duration-150 cursor-pointer min-h-[40px]",
              variant === "pill" && [
                "rounded-lg",
                isActive
                  ? "bg-white text-[#1E3A8A] font-semibold shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-white/50",
              ],
              variant === "underline" && [
                "-mb-px border-b-2",
                isActive
                  ? "border-[#1E3A8A] text-[#1E3A8A] font-semibold"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]",
              ]
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs font-semibold",
                  isActive ? "bg-[#DBEAFE] text-[#1E3A8A]" : "bg-[#E2E8F0] text-[#64748B]"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
