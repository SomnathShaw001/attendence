"use client";

import { CheckCheck, UserX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceStatus } from "@/lib/validations/attendance";

interface AttendanceSummaryBarProps {
  total: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: "ALL" | AttendanceStatus;
  onStatusFilterChange: (status: "ALL" | AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  isReadOnly?: boolean;
}

export function AttendanceSummaryBar({
  total,
  presentCount,
  absentCount,
  lateCount,
  excusedCount,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onMarkAllPresent,
  onMarkAllAbsent,
  isReadOnly = false,
}: AttendanceSummaryBarProps) {
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount + excusedCount) / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-center sm:text-left">
          <span className="text-xs font-medium text-slate-500 block">Enrolled Total</span>
          <span className="text-xl font-bold text-slate-900">{total}</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Present</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">
              {total > 0 ? Math.round((presentCount / total) * 100) : 0}%
            </span>
          </div>
          <span className="text-xl font-bold text-emerald-800">{presentCount}</span>
        </div>

        <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Absent</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-200/60 text-rose-800">
              {total > 0 ? Math.round((absentCount / total) * 100) : 0}%
            </span>
          </div>
          <span className="text-xl font-bold text-rose-800">{absentCount}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center sm:text-left">
          <span className="text-xs font-semibold text-amber-700 block">Late</span>
          <span className="text-xl font-bold text-amber-800">{lateCount}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-sky-50 border border-sky-200/60 rounded-xl p-3 text-center sm:text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700">Excused</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Net {attendanceRate}%
            </span>
          </div>
          <span className="text-xl font-bold text-sky-800">{excusedCount}</span>
        </div>
      </div>

      {/* Action Controls and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {/* Quick Bulk Actions */}
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onMarkAllPresent}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Mark All Present
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMarkAllAbsent}
              className="text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
            >
              <UserX className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              Clear / Mark All Absent
            </Button>
          </div>
        )}

        {/* Search and Category Filter */}
        <div className="flex flex-1 items-center justify-end gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search roll no or name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Status Tabs */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => onStatusFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-semibold" : "hover:text-slate-900"
              }`}
            >
              All ({total})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("PRESENT")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "PRESENT" ? "bg-white text-emerald-700 shadow-xs font-semibold" : "hover:text-emerald-700"
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("ABSENT")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "ABSENT" ? "bg-white text-rose-700 shadow-xs font-semibold" : "hover:text-rose-700"
              }`}
            >
              Absent ({absentCount})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("LATE")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "LATE" ? "bg-white text-amber-700 shadow-xs font-semibold" : "hover:text-amber-700"
              }`}
            >
              Late ({lateCount})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("EXCUSED")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "EXCUSED" ? "bg-white text-sky-700 shadow-xs font-semibold" : "hover:text-sky-700"
              }`}
            >
              Excused ({excusedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
