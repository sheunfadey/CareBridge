import { CareBridgeLoader } from "@/components/feedback/carebridge-loader";
import { cn } from "cn";

type AppLoadingScreenProps = {
  message?: string;
  variant?: "fullscreen" | "contained";
  className?: string;
};

export function AppLoadingScreen({
  message = "Preparing your CareBridge workspace...",
  variant = "fullscreen",
  className,
}: AppLoadingScreenProps) {
  return (
    <CareBridgeLoader
      message={message}
      compact={variant === "contained"}
      className={cn(className)}
    />
  );
}
