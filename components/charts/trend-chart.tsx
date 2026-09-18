"use client";

import React, { useState } from "react";

export interface TrendDataPoint {
  date: string;
  total: number;
  present: number;
  percentage: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  threshold?: number;
  height?: number;
  emptyMessage?: string;
}

export function TrendChart({
  data,
  threshold = 75,
  height = 200,
  emptyMessage = "No historical sessions recorded in this timeframe",
}: TrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl bg-muted/20"
        style={{ minHeight: height }}
      >
        <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = 600; // coordinate space
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // X coordinate mapping
  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (data.length - 1)) * innerWidth;
  };

  // Y coordinate mapping (0% at bottom, 100% at top)
  const getY = (pct: number) => {
    const clamped = Math.min(Math.max(pct, 0), 100);
    return padding.top + innerHeight - (clamped / 100) * innerHeight;
  };

  // Build SVG path
  const points = data.map((d, i) => `${getX(i)},${getY(d.percentage)}`);
  const pathD = `M ${points.join(" L ")}`;

  // Area under line
  const areaD = `M ${getX(0)},${padding.top + innerHeight} L ${points.join(" L ")} L ${getX(
    data.length - 1
  )},${padding.top + innerHeight} Z`;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map((level) => {
          const y = getY(level);
          return (
            <g key={level}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity={level === threshold ? "0.3" : "0.08"}
                strokeDasharray={level === threshold ? "4 4" : undefined}
                className="text-foreground"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground font-mono"
              >
                {level}%
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaD} fill="url(#trendGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="rgb(59 130 246)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const cx = getX(index);
          const cy = getY(point.percentage);
          const isHovered = hoveredPoint?.date === point.date;

          return (
            <g key={point.date}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                className={`transition-all duration-150 cursor-pointer ${
                  point.percentage >= threshold
                    ? "fill-blue-600 stroke-background"
                    : "fill-rose-500 stroke-background"
                }`}
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {/* Dates on X-axis (sample start, middle, end) */}
        {data.length > 0 && (
          <>
            <text
              x={getX(0)}
              y={height - 8}
              textAnchor="start"
              className="text-[10px] fill-muted-foreground font-mono"
            >
              {data[0].date}
            </text>
            {data.length > 2 && (
              <text
                x={getX(Math.floor((data.length - 1) / 2))}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-muted-foreground font-mono"
              >
                {data[Math.floor((data.length - 1) / 2)].date}
              </text>
            )}
            <text
              x={getX(data.length - 1)}
              y={height - 8}
              textAnchor="end"
              className="text-[10px] fill-muted-foreground font-mono"
            >
              {data[data.length - 1].date}
            </text>
          </>
        )}
      </svg>

      {/* Floating tooltip */}
      {hoveredPoint && (
        <div className="absolute top-2 right-4 bg-popover/95 border border-border shadow-md rounded-lg p-2.5 text-xs backdrop-blur-sm pointer-events-none transition-all">
          <p className="font-semibold text-foreground mb-1">{hoveredPoint.date}</p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Attendance Rate:</span>
            <span
              className={`font-bold ${
                hoveredPoint.percentage >= threshold ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {hoveredPoint.percentage.toFixed(1)}%
            </span>
          </div>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            {hoveredPoint.present} present out of {hoveredPoint.total} students
          </p>
        </div>
      )}
    </div>
  );
}
