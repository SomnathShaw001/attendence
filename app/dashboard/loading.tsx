export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="h-8 w-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-slate-200/80 space-y-4">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-50 rounded-xl border border-slate-100" />
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-50 rounded-xl border border-slate-100" />
        </div>
      </div>
    </div>
  );
}
