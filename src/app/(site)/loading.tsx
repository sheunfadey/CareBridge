import { PageLoadingSkeleton } from "@/components/feedback/page-loading-skeleton";

export default function SiteLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <PageLoadingSkeleton cards={3} rows={5} />
    </div>
  );
}
