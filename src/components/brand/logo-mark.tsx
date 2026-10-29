import { cn } from "cn";

import {
  logoGeometry,
  logoTones,
  type LogoTone,
} from "@/components/brand/logo-geometry";

type LogoMarkProps = {
  size?: number;
  tone?: LogoTone;
  className?: string;
};

export function LogoMark({ size = 34, tone = "default", className }: LogoMarkProps) {
  const colors = tone === "mono" ? null : logoTones[tone];
  const fill = colors ? colors.figure : "currentColor";
  const arch = colors ? colors.arch : "currentColor";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="presentation"
      width={size}
      height={size}
      viewBox={logoGeometry.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {logoGeometry.bodies.map((body, index) => (
        <rect key={`body-${index}`} fill={fill} {...body} />
      ))}
      {logoGeometry.heads.map((head, index) => (
        <circle key={`head-${index}`} fill={fill} {...head} />
      ))}
      <path
        d={logoGeometry.archPath}
        stroke={arch}
        strokeWidth={logoGeometry.archStrokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
