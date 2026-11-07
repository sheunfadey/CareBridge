import { cn } from "cn";

export type EmblemTone = "dark" | "light" | "mono";

export const emblemPalette: Record<
  EmblemTone,
  { blue: string; bright: string; green: string; navy: string; white: string }
> = {
  dark: {
    blue: "#087FE5",
    bright: "#08B7F0",
    green: "#20C840",
    navy: "#102B5C",
    white: "#FFFFFF",
  },
  light: {
    blue: "#08B7F0",
    bright: "#8FE5FF",
    green: "#20C840",
    navy: "#FFFFFF",
    white: "#FFFFFF",
  },
  mono: {
    blue: "currentColor",
    bright: "currentColor",
    green: "currentColor",
    navy: "currentColor",
    white: "currentColor",
  },
};

export const emblemPaths = {
  heartLeft:
    "M256 104C204 30 96 38 62 132C32 214 86 312 192 390",
  heartRight:
    "M256 104C308 30 416 38 450 132C480 214 426 312 320 390",
  roof: "M162 248L256 158L350 248",
  caregiverBody:
    "M150 360C146 304 168 280 198 274C228 280 250 304 246 360Z",
  caregiverArm: "M232 300C274 306 300 322 320 342",
  recipientBody:
    "M284 360C284 316 302 296 326 292C354 296 372 318 372 360Z",
  recipientArch:
    "M334 360V332C334 320 342 314 350 314C358 314 366 320 366 332V360",
  bridge: "M84 416C190 366 322 366 428 416",
} as const;

type LogoEmblemProps = {
  size?: number;
  tone?: EmblemTone;
  className?: string;
  title?: string;
};

export function LogoEmblem({
  size = 48,
  tone = "dark",
  className,
  title,
}: LogoEmblemProps) {
  const colors = emblemPalette[tone];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {title ? <title>{title}</title> : null}

      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d={emblemPaths.heartLeft}
          stroke={colors.blue}
          strokeWidth={30}
        />
        <path
          d={emblemPaths.heartRight}
          stroke={colors.green}
          strokeWidth={30}
        />
        <path
          d={emblemPaths.heartLeft}
          stroke={colors.bright}
          strokeWidth={7}
          opacity={0.22}
        />
        <path
          d={emblemPaths.heartRight}
          stroke={colors.white}
          strokeWidth={6}
          opacity={0.14}
        />

        <path
          d={emblemPaths.roof}
          stroke={colors.navy}
          strokeWidth={20}
        />
        <g fill={colors.navy}>
          <rect x={244} y={198} width={11} height={11} rx={2} />
          <rect x={261} y={198} width={11} height={11} rx={2} />
          <rect x={244} y={215} width={11} height={11} rx={2} />
          <rect x={261} y={215} width={11} height={11} rx={2} />
        </g>

        <circle cx={198} cy={246} r={36} fill={colors.blue} />
        <path d={emblemPaths.caregiverBody} fill={colors.blue} />
        <path
          d={emblemPaths.caregiverArm}
          stroke={colors.blue}
          strokeWidth={22}
        />

        <circle cx={326} cy={266} r={32} fill={colors.green} />
        <path d={emblemPaths.recipientBody} fill={colors.green} />
        <path
          d={emblemPaths.recipientArch}
          stroke={colors.white}
          strokeWidth={10}
        />

        <path
          d={emblemPaths.bridge}
          stroke={colors.white}
          strokeWidth={42}
        />
        <path
          d={emblemPaths.bridge}
          stroke={colors.blue}
          strokeWidth={26}
        />
        <path
          d="M104 407C206 367 320 367 408 407"
          stroke={colors.bright}
          strokeWidth={6}
          opacity={0.5}
        />
      </g>
    </svg>
  );
}
