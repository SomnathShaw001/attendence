"use client";

import { Search, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceStatus } from "@/lib/validations/attendance";

export interface AttendanceHistoryFilterState {
  startDate: string;
  endDate: string;
  classId: string;
  subjectId: string;
  studentId: string;
  status: AttendanceStatus | "ALL";
  search: string;
}

interface AttendanceHistoryFilterProps {
  filters: AttendanceHistoryFilterState;
  onFilterChange: (updates: Partial<AttendanceHistoryFilterState>) => void;
  onResetFilters: () => void;
  classes: Array<{ id: string; name: string; section: string }>;
  subjects: Array<{ id: string; code: string; name: string }>;
  students: Array<{ id: string; rollNo: string; name: string }>;
  userRole: string;
  isSearching?: boolean;
}

export function AttendanceHistoryFilter({
  filters,
  onFilterChange,
  onResetFilters,
  classes,
  subjects,
  students,
  userRole,
}: AttendanceHistoryFilterProps) {
  const isStaff = userRole === "ADMIN" || userRole === "TEACHER";

  const hasActiveFilters =
    Boolean(filters.startDate) ||
    Boolean(filters.endDate) ||
    filters.classId !== "all" ||
    filters.subjectId !== "all" ||
    filters.studentId !== "all" ||
    filters.status !== "ALL" ||
    Boolean(filters.search.trim());

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filter Records</span>
        </div>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 h-7 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Search Bar (Staff & Student) */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
          <label htmlFor="filter-search" className="block text-xs font-medium text-slate-600 mb-1">
            {isStaff ? "Search Student (Name, Roll No, Email)" : "Search Records"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="filter-search"
              type="text"
              placeholder={isStaff ? "e.g. John Doe, CS2026-001..." : "e.g. CS101, Midterm..."}
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="filter-start-date" className="block text-xs font-medium text-slate-600 mb-1">
            From Date
          </label>
          <div className="relative">
            <input
              id="filter-start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="filter-end-date" className="block text-xs font-medium text-slate-600 mb-1">
            To Date
          </label>
          <div className="relative">
            <input
              id="filter-end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        {/* Class Filter */}
        <div>
          <label htmlFor="filter-class" className="block text-xs font-medium text-slate-600 mb-1">
            Class Section
          </label>
          <select
            id="filter-class"
            value={filters.classId}
            onChange={(e) => onFilterChange({ classId: e.target.value })}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Sec {c.section})
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label htmlFor="filter-subject" className="block text-xs font-medium text-slate-600 mb-1">
            Course Subject
          </label>
          <select
            id="filter-subject"
            value={filters.subjectId}
            onChange={(e) => onFilterChange({ subjectId: e.target.value })}
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Attendance Status Filter */}
        <div>
          <label htmlFor="filter-status" className="block text-xs font-medium text-slate-600 mb-1">
            Attendance Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ status: e.target.value as AttendanceStatus | "ALL" })
            }
            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </div>

        {/* Student Filter (Authorized Staff Only) */}
        {isStaff && (
          <div>
            <label htmlFor="filter-student" className="block text-xs font-medium text-slate-600 mb-1">
              Filter by Student
            </label>
            <select
              id="filter-student"
              value={filters.studentId}
              onChange={(e) => onFilterChange({ studentId: e.target.value })}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Students</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.rollNo ? `[${st.rollNo}] ` : ""}{st.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
