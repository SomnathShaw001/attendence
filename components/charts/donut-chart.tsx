"use client";

import React, { useState } from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
  emptyMessage?: string;
}

export function DonutChart({
  data,
  size = 220,
  strokeWidth = 32,
  centerLabel,
  centerSublabel,
  emptyMessage = "No attendance records available",
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-xl bg-muted/20"
        style={{ minHeight: size }}
      >
        <div className="w-16 h-16 rounded-full border-4 border-dashed border-muted-foreground/30 flex items-center justify-center mb-3">
          <span className="text-xs text-muted-foreground font-mono">0%</span>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-calculate segment offsets purely without external variable mutations
  const segments = data.reduce<
    Array<
      DonutSegment & {
        index: number;
        strokeDasharray: string;
        strokeDashoffset: number;
      }
    >
  >((acc, item, index) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].strokeDashoffset : 0;
    const prevValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
    const currentOffsetFraction =
      acc.length > 0
        ? -prevOffset / circumference + prevValue / total
        : 0;

    acc.push({
      ...item,
      index,
      strokeDasharray: `${(item.value / total) * circumference} ${circumference}`,
      strokeDashoffset: -currentOffsetFraction * circumference,
    });
    return acc;
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      {/* SVG Donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 origin-center"
        >
          {segments.map((item) => {
            if (item.value === 0) return null;
            const isHovered = hoveredIndex === item.index;

            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={item.strokeDasharray}
                strokeDashoffset={item.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(item.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {hoveredIndex !== null
              ? `${Math.round((data[hoveredIndex].value / total) * 100)}%`
              : centerLabel || total.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {hoveredIndex !== null
              ? data[hoveredIndex].label
              : centerSublabel || "Total Records"}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2.5 min-w-[160px]">
        {data.map((item, index) => {
          const pct = Math.round((item.value / total) * 100) || 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.label}
              className={`flex items-center justify-between gap-3 text-sm px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isHovered ? "bg-muted font-medium" : "hover:bg-muted/50"
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="font-semibold text-foreground">{item.value}</span>
                <span className="text-xs text-muted-foreground w-9 text-right">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
