export default function ClassesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted/60 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted rounded-lg" />
          <div className="h-9 w-32 bg-muted rounded-lg" />
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="border-b border-border flex gap-6 pb-3">
        <div className="h-5 w-32 bg-muted rounded" />
        <div className="h-5 w-32 bg-muted rounded" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="h-9 w-72 bg-card border border-border rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-36 bg-card border border-border rounded-lg" />
          <div className="h-9 w-36 bg-card border border-border rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2.5 border-b border-border/50">
            <div className="space-y-1">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted/60 rounded" />
            </div>
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-5 w-24 bg-muted rounded" />
            <div className="h-5 w-20 bg-muted rounded" />
            <div className="h-7 w-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
