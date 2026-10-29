import { AnimatedCareBridgeLogo } from "@/components/brand/animated-carebridge-logo";
import { InlineLoadingIndicator } from "@/components/feedback/inline-loading-indicator";
import { cn } from "cn";

type AppLoadingScreenProps = {
  message?: string;
  variant?: "fullscreen" | "contained";
  className?: string;
};

export function AppLoadingScreen({
  message = "Preparing your workspace",
  variant = "fullscreen",
  className,
}: AppLoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-8 bg-background",
        variant === "fullscreen" ? "min-h-svh" : "min-h-[60vh] rounded-xl",
        className,
      )}
    >
      <AnimatedCareBridgeLogo size="xl" showTagline />
      <InlineLoadingIndicator label={message} size="sm" />
    </div>
  );
}
