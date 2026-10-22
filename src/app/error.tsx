"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { logger } from "@/lib/monitoring/logger";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger.error("Client caught application error", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="max-w-md w-full p-8 rounded-3xl border border-[#E2E8F0] bg-white text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] text-[#B91C1C] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Something went wrong</h2>
        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
          We encountered an unexpected issue. Don't worry, your data and store settings are completely safe.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => reset()} className="w-full">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Try Again</span>
          </Button>
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button variant="ghost" size="sm" className="w-full text-xs text-[#64748B]">
              Need help? Contact support on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
