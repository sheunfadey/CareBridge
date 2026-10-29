type StatItem = {
  label: string;
  value: string | number;
  hint?: string;
};

export function EmptyStateCard({ items }: { items?: StatItem[] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-dashed border-border bg-card/60 p-4"
        >
          <dt className="text-xs font-medium text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-navy">
            {item.value}
          </dd>
          {item.hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
