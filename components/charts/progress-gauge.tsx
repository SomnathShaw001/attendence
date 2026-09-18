"use client";

import React from "react";

interface ProgressGaugeProps {
  value: number | null; // percentage 0 - 100 or null if no data
  threshold?: number; // default 75
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function ProgressGauge({
  value,
  threshold = 75,
  size = 180,
  strokeWidth = 14,
  label = "Attendance Rate",
}: ProgressGaugeProps) {
  if (value === null) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl bg-muted/20"
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-semibold text-muted-foreground">N/A</span>
        <span className="text-xs text-muted-foreground mt-1">No sessions recorded</span>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  // Semi-circle arc (180 degrees)
  const arcLength = Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = arcLength - (clampedValue / 100) * arcLength;

  const isBelowThreshold = value < threshold;
  const strokeColor = isBelowThreshold
    ? "stroke-rose-500"
    : value >= 85
    ? "stroke-emerald-500"
    : "stroke-amber-500";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Background track arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
              size - strokeWidth / 2
            } ${size / 2}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted/40"
          />

          {/* Value arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
              size - strokeWidth / 2
            } ${size / 2}`}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${strokeColor} transition-all duration-700 ease-out`}
          />
        </svg>

        {/* Center metric */}
        <div className="absolute inset-0 top-6 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {value.toFixed(1)}%
          </span>
          <span className="text-xs font-medium text-muted-foreground mt-0.5">{label}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isBelowThreshold
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isBelowThreshold
            ? `${(threshold - value).toFixed(1)}% Below Target (${threshold}%)`
            : `On Track (Target: ${threshold}%)`}
        </span>
      </div>
    </div>
  );
}
