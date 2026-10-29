"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CartRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params?.subdomain as string;

  useEffect(() => {
    if (subdomain) {
      router.replace(`/s/${subdomain}?view=cart`);
    }
  }, [subdomain, router]);

  return null;
}
