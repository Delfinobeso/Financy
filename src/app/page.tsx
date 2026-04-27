"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBudget } from "@/lib/context";
import { isPinEnabled } from "@/lib/pin";

export default function Home() {
  const { budget, isLoaded } = useBudget();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!budget) {
      router.replace("/onboarding");
    } else if (isPinEnabled()) {
      router.replace("/pin");
    } else {
      router.replace("/dashboard");
    }
  }, [budget, isLoaded, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
    </div>
  );
}
