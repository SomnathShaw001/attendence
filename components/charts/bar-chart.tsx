"use client";

import React from "react";

export interface BarDataPoint {
  label: string;
  sublabel?: string;
  value: number; // percentage 0 - 100
  secondaryValue?: number; // count
  tooltipExtra?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  threshold?: number; // e.g. 75% benchmark
  emptyMessage?: string;
  height?: number;
}

export function BarChart({
  data,
  threshold = 75,
  emptyMessage = "No comparison data available",
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl bg-muted/20 min-h-[220px]">
        <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Target reference pill */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1 border-b border-border/50">
        <span>Entity</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>&ge; {threshold}% Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span>&lt; {threshold}% Risk</span>
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((item) => {
          const isBelowThreshold = item.value < threshold;
          const barColor = isBelowThreshold
            ? "bg-rose-500"
            : item.value >= 85
            ? "bg-emerald-500"
            : "bg-amber-500";

          return (
            <div key={item.label} className="group flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-xs sm:text-sm">
                <div className="flex items-baseline gap-2 truncate pr-2">
                  <span className="font-medium text-foreground truncate">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                      ({item.sublabel})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.secondaryValue !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {item.secondaryValue} records
                    </span>
                  )}
                  <span
                    className={`font-semibold tabular-nums text-xs px-2 py-0.5 rounded ${
                      isBelowThreshold
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {item.value.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="relative w-full h-3 bg-muted/60 rounded-full overflow-hidden">
                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/40 z-10"
                  style={{ left: `${threshold}%` }}
                  title={`Target: ${threshold}%`}
                />
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                  style={{ width: `${Math.min(Math.max(item.value, 0), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
