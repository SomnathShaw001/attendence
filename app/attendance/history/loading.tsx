import { AppShell } from "@/components/dashboard/app-shell";

export default function AttendanceHistoryLoading() {
  return (
    <AppShell>
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-md"></div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-slate-200/80 pb-3">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="h-6 w-36 bg-slate-200 rounded"></div>
        </div>

        {/* Filter Bar Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="h-5 w-28 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="h-9 bg-slate-100 rounded-xl"></div>
            <div className="h-9 bg-slate-100 rounded-xl"></div>
            <div className="h-9 bg-slate-100 rounded-xl"></div>
            <div className="h-9 bg-slate-100 rounded-xl"></div>
          </div>
        </div>

        {/* Summary Metrics Row Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white border border-slate-200/80 rounded-xl p-3"></div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
