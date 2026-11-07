import { cn } from "cn";

import { LogoEmblem } from "@/components/brand/logo-emblem";
import type { LogoTone } from "@/components/brand/logo-geometry";

type LogoMarkProps = {
  size?: number;
  tone?: LogoTone;
  className?: string;
};

export function LogoMark({
  size = 40,
  tone = "default",
  className,
}: LogoMarkProps) {
  const emblemTone =
    tone === "onDark" ? "light" : tone === "mono" ? "mono" : "dark";

  return (
    <LogoEmblem
      size={size}
      tone={emblemTone}
      className={cn("shrink-0", className)}
    />
  );
}
