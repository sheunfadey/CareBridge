import { AppLoadingScreen } from "@/components/feedback/app-loading-screen";

type RouteLoadingFallbackProps = {
  message?: string;
};

export function RouteLoadingFallback({ message }: RouteLoadingFallbackProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <AppLoadingScreen variant="contained" message={message} />
    </div>
  );
}
