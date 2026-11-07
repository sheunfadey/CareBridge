import { cn } from "cn";

import { CareBridgeLogo } from "@/components/brand/carebridge-logo";
import { brand } from "@/config/brand";

type CareBridgeLoaderProps = {
  message?: string;
  compact?: boolean;
  className?: string;
};

export function CareBridgeLoader({
  message = "Preparing your CareBridge workspace...",
  compact = false,
  className,
}: CareBridgeLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#071A3A_0%,#102B5C_55%,#07182D_100%)] text-white",
        compact ? "min-h-[70vh] rounded-xl" : "min-h-svh",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/4 size-72 rounded-full bg-brand-blue/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-1/4 size-80 rounded-full bg-brand-green/15 blur-3xl"
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="cb-loader-logo">
          <CareBridgeLogo
            variant="stacked"
            size={compact ? "lg" : "xl"}
            tone="onDark"
            showTagline
          />
        </div>

        <div className="mt-8 h-px w-44 overflow-hidden rounded-full bg-white/15">
          <span className="cb-loader-line block h-full w-1/3 rounded-full bg-gradient-to-r from-brand-blue via-brand-bright-blue to-brand-green" />
        </div>

        <p className="mt-4 text-sm text-white/70">{message}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
          {brand.name}
        </p>
      </div>
    </div>
  );
}
