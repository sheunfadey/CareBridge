"use client";

import { useEffect, useState } from "react";

import { HillCrestLoader } from "@/components/feedback/carebridge-loader";

/**
 * One-time application startup splash. It is mounted once by AppProviders and
 * never replays on client-side dashboard navigation.
 */
export function InitialBrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <HillCrestLoader message="Preparing your HillCrest workspace..." />
    </div>
  );
}
