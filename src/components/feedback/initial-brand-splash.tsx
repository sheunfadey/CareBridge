"use client";

import { useEffect, useState } from "react";

import { CareBridgeLoader } from "@/components/feedback/carebridge-loader";

/**
 * One-time application startup splash. It is mounted once by AppProviders and
 * never replays on client-side dashboard navigation.
 */
export function InitialBrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <CareBridgeLoader message="Preparing your CareBridge workspace..." />
    </div>
  );
}
