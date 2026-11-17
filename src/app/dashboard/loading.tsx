import { PageLoadingSkeleton } from "@/components/feedback/page-loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageLoadingSkeleton cards={4} rows={6} />
    </div>
  );
}
