"use client";

import { useState } from "react";
import { AttendanceStatus } from "@/lib/validations/attendance";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Check, X, Clock, HelpCircle } from "lucide-react";

export interface RollCallStudent {
  studentId: string;
  rollNo: string;
  name: string;
  email: string;
  batch: string;
  department: string;
  isActive: boolean;
  recordId: string | null;
  status: AttendanceStatus;
  remarks: string;
}

interface RollCallCardProps {
  item: RollCallStudent;
  index: number;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onRemarksChange: (studentId: string, remarks: string) => void;
  isReadOnly?: boolean;
}

export function RollCallCard({
  item,
  index,
  onStatusChange,
  onRemarksChange,
  isReadOnly = false,
}: RollCallCardProps) {
  const [showRemarks, setShowRemarks] = useState(Boolean(item.remarks));

  // Determine row border / highlight based on status
  const statusBorderMap: Record<AttendanceStatus, string> = {
    PRESENT: "border-slate-200/80 hover:border-emerald-300",
    ABSENT: "border-rose-300/80 bg-rose-50/20",
    LATE: "border-amber-300/80 bg-amber-50/20",
    EXCUSED: "border-sky-300/80 bg-sky-50/20",
  };

  return (
    <div
      className={`bg-white rounded-xl border p-3.5 transition-all duration-150 ${
        statusBorderMap[item.status] || "border-slate-200/80"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Student Info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
            {item.rollNo || index + 1}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {item.name}
              </span>
              {!item.isActive && (
                <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                  Inactive
                </Badge>
              )}
              <span className="text-xs text-slate-500 font-mono hidden md:inline">
                {item.rollNo}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="truncate">{item.email}</span>
              {item.department && (
                <>
                  <span>•</span>
                  <span>{item.department}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Toggle Buttons & Remarks Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Quick Segmented Status Controls */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200/70 text-xs font-medium">
            {/* PRESENT */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onStatusChange(item.studentId, "PRESENT")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                item.status === "PRESENT"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-emerald-700 hover:bg-white/60"
              } ${isReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
              title="Mark Present (P)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>P</span>
              <span className="hidden xl:inline">resent</span>
            </button>

            {/* ABSENT */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onStatusChange(item.studentId, "ABSENT")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                item.status === "ABSENT"
                  ? "bg-rose-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-rose-700 hover:bg-white/60"
              } ${isReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
              title="Mark Absent (A)"
            >
              <X className="w-3.5 h-3.5" />
              <span>A</span>
              <span className="hidden xl:inline">bsent</span>
            </button>

            {/* LATE */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onStatusChange(item.studentId, "LATE")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                item.status === "LATE"
                  ? "bg-amber-500 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-amber-700 hover:bg-white/60"
              } ${isReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
              title="Mark Late (L)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>L</span>
              <span className="hidden xl:inline">ate</span>
            </button>

            {/* EXCUSED */}
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => onStatusChange(item.studentId, "EXCUSED")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all ${
                item.status === "EXCUSED"
                  ? "bg-sky-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-sky-700 hover:bg-white/60"
              } ${isReadOnly ? "cursor-not-allowed opacity-80" : ""}`}
              title="Mark Excused (E)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>E</span>
              <span className="hidden xl:inline">xcused</span>
            </button>
          </div>

          {/* Remarks Toggle Button */}
          <button
            type="button"
            onClick={() => setShowRemarks(!showRemarks)}
            className={`p-1.5 rounded-lg border transition-colors ${
              item.remarks || showRemarks
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
            title={item.remarks ? `Note: ${item.remarks}` : "Add remarks / excuse note"}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Remarks Field */}
      {showRemarks && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            disabled={isReadOnly}
            placeholder="Add note (e.g., Medical leave, official sports duty, late by 15 mins)..."
            value={item.remarks}
            onChange={(e) => onRemarksChange(item.studentId, e.target.value)}
            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>
      )}
    </div>
  );
}
