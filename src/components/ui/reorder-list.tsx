import * as React from "react";
import { cn } from "@/lib/utils";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export interface ReorderItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export interface ReorderListProps {
  items: ReorderItem[];
  onChange: (items: ReorderItem[]) => void;
  className?: string;
}

export function ReorderList({ items, onChange, className }: ReorderListProps) {
  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    onChange(newItems);
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E2E8F0] bg-white shadow-2xs hover:border-[#CBD5E1] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="text-[#94A3B8] cursor-grab active:cursor-grabbing p-1">
              <GripVertical className="w-4 h-4" />
            </div>
            {item.icon && <div className="text-[#1E3A8A]">{item.icon}</div>}
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold text-[#0F172A]">{item.title}</span>
              {item.subtitle && <span className="text-xs text-[#64748B]">{item.subtitle}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => moveItem(index, "up")}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Move item up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={index === items.length - 1}
              onClick={() => moveItem(index, "down")}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none transition-colors"
              aria-label="Move item down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
