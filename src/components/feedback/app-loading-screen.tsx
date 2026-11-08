import { HillCrestLoader } from "@/components/feedback/carebridge-loader";
import { cn } from "cn";

type AppLoadingScreenProps = {
  message?: string;
  variant?: "fullscreen" | "contained";
  className?: string;
};

export function AppLoadingScreen({
  message = "Preparing your HillCrest workspace...",
  variant = "fullscreen",
  className,
}: AppLoadingScreenProps) {
  return (
    <HillCrestLoader
      message={message}
      compact={variant === "contained"}
      className={cn(className)}
    />
  );
}
