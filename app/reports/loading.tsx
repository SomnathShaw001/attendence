import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      {/* KPI skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/60 lg:col-span-1">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-56" />
          </CardHeader>
          <CardContent className="h-56 flex items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </CardContent>
        </Card>

        <Card className="border-border/60 lg:col-span-2">
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="h-56">
            <Skeleton className="h-full w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Row 3 skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-52" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-8 w-full rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
