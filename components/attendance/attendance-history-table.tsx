"use client";

import { Eye, Edit3, Lock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { AttendanceRecordItem } from "./attendance-record-detail-modal";

interface AttendanceHistoryTableProps {
  records: AttendanceRecordItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  summary: {
    total: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
  };
  onPageChange: (newPage: number) => void;
  onViewDetails: (record: AttendanceRecordItem) => void;
  onEditRecord: (record: AttendanceRecordItem) => void;
  userRole: string;
  isLoading?: boolean;
}

export function AttendanceHistoryTable({
  records,
  pagination,
  summary,
  onPageChange,
  onViewDetails,
  onEditRecord,
  userRole,
  isLoading = false,
}: AttendanceHistoryTableProps) {
  const isStaff = userRole === "ADMIN" || userRole === "TEACHER";

  const statusVariantMap: Record<string, "success" | "danger" | "warning" | "default"> = {
    PRESENT: "success",
    ABSENT: "danger",
    LATE: "warning",
    EXCUSED: "default",
  };

  const attendanceRate =
    summary.total > 0
      ? Math.round(((summary.presentCount + summary.lateCount + summary.excusedCount) / summary.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Top Metrics Row for current filter selection */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center sm:text-left shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Records</span>
          <span className="text-xl font-bold text-slate-900">{summary.total}</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-3 text-center sm:text-left shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Present</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">
              {summary.total > 0 ? Math.round((summary.presentCount / summary.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-xl font-bold text-emerald-800">{summary.presentCount}</span>
        </div>

        <div className="bg-rose-50/60 border border-rose-200/60 rounded-xl p-3 text-center sm:text-left shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Absent</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-200/60 text-rose-800">
              {summary.total > 0 ? Math.round((summary.absentCount / summary.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-xl font-bold text-rose-800">{summary.absentCount}</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 text-center sm:text-left shadow-xs">
          <span className="text-xs font-semibold text-amber-700 block">Late</span>
          <span className="text-xl font-bold text-amber-800">{summary.lateCount}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-sky-50/60 border border-sky-200/60 rounded-xl p-3 text-center sm:text-left shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-700">Excused</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Rate {attendanceRate}%
            </span>
          </div>
          <span className="text-xl font-bold text-sky-800">{summary.excusedCount}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {records.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No Attendance Records Found"
              description="No attendance entries matched your selected filters or date range. Try clearing or expanding your filter parameters."
              icon={AlertCircle}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date & Session</th>
                  <th className="py-3 px-4">Subject & Class</th>
                  {isStaff && <th className="py-3 px-4">Student</th>}
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks / Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => {
                  const isLocked = rec.classSession.verifiedAt !== null;
                  const canEdit = userRole === "ADMIN" || (userRole === "TEACHER" && !isLocked);

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Date & Session */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {formatDate(rec.classSession.date)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rec.classSession.startTime || "Regular Session"}
                        </div>
                      </td>

                      {/* Subject & Class Section */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                            {rec.classSession.subject.name}
                          </span>
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {rec.classSession.subject.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rec.classSession.class.name} (Sec {rec.classSession.class.section})
                        </div>
                      </td>

                      {/* Student Info (Staff View) */}
                      {isStaff && (
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                              {rec.student.rollNo}
                            </span>
                            <div className="min-w-0">
                              <span className="font-medium text-slate-900 truncate block">
                                {rec.student.user.name}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Attendance Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={statusVariantMap[rec.status] || "default"}
                          className="text-[11px] font-bold uppercase tracking-wider"
                        >
                          {rec.status}
                        </Badge>
                      </td>

                      {/* Remarks & Lock Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {rec.remarks ? (
                            <span className="text-[11px] text-slate-600 italic truncate max-w-[200px]" title={rec.remarks}>
                              &ldquo;{rec.remarks}&rdquo;
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                          {isLocked && (
                            <span title="Session verified and locked" className="text-amber-600 flex-shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => onViewDetails(rec)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onEditRecord(rec)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors"
                              title="Edit Attendance Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {records.length > 0 && pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{" "}
              <strong className="text-slate-700">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-700">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </strong>{" "}
              of <strong className="text-slate-700">{pagination.total}</strong> records
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => onPageChange(pagination.page - 1)}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>

              <span className="px-2 font-medium text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => onPageChange(pagination.page + 1)}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
