import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC]">
      <div className="max-w-md w-full p-8 rounded-lg border border-[#E2E8F0] bg-white text-center shadow-lg">
        <div className="w-14 h-14 rounded-md bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">Page Not Found</h2>
        <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
          The page or store you are looking for does not exist or may have been relocated.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/">
            <Button className="w-full">Return Home</Button>
          </Link>
          <Link href="/gallery">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Go to Component Gallery
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
