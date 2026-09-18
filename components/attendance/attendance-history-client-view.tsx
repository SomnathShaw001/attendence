"use client";

import { useState, useEffect } from "react";
import { getAttendanceHistory } from "@/app/attendance/actions";
import { AttendanceHistoryFilter, AttendanceHistoryFilterState } from "./attendance-history-filter";
import { AttendanceHistoryTable } from "./attendance-history-table";
import { AttendanceRecordDetailModal, AttendanceRecordItem } from "./attendance-record-detail-modal";
import { AttendanceEditDialog } from "./attendance-edit-dialog";

interface AttendanceHistoryClientViewProps {
  initialClasses: Array<{ id: string; name: string; section: string }>;
  initialSubjects: Array<{ id: string; code: string; name: string }>;
  initialStudents: Array<{ id: string; rollNo: string; name: string }>;
  userRole: string;
}

export function AttendanceHistoryClientView({
  initialClasses,
  initialSubjects,
  initialStudents,
  userRole,
}: AttendanceHistoryClientViewProps) {
  // Filters state
  const [filters, setFilters] = useState<AttendanceHistoryFilterState>({
    startDate: "",
    endDate: "",
    classId: "all",
    subjectId: "all",
    studentId: "all",
    status: "ALL",
    search: "",
  });

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Data state
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 15,
    totalPages: 0,
  });
  const [summary, setSummary] = useState({
    total: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState<AttendanceRecordItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Asynchronously query attendance history on filter/page/trigger change
  useEffect(() => {
    let ignore = false;

    getAttendanceHistory({
      page,
      pageSize,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      classId: filters.classId !== "all" ? filters.classId : undefined,
      subjectId: filters.subjectId !== "all" ? filters.subjectId : undefined,
      studentId: filters.studentId !== "all" ? filters.studentId : undefined,
      status: filters.status !== "ALL" ? filters.status : undefined,
      search: filters.search.trim() || undefined,
    })
      .then((res) => {
        if (ignore) return;
        setIsLoading(false);
        setRecords(res.records as unknown as AttendanceRecordItem[]);
        setPagination(res.pagination);
        setSummary(res.summary);
      })
      .catch((err: unknown) => {
        if (ignore) return;
        console.error("Failed to load attendance history:", err);
        setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, pageSize, filters, fetchTrigger]);

  const handleFilterChange = (updates: Partial<AttendanceHistoryFilterState>) => {
    setIsLoading(true);
    setPage(1);
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setIsLoading(true);
    setPage(1);
    setFilters({
      startDate: "",
      endDate: "",
      classId: "all",
      subjectId: "all",
      studentId: "all",
      status: "ALL",
      search: "",
    });
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
  };

  const handleViewDetails = (rec: AttendanceRecordItem) => {
    setSelectedRecord(rec);
    setIsDetailOpen(true);
  };

  const handleEditRecord = (rec: AttendanceRecordItem) => {
    setEditingRecord(rec);
    setIsEditOpen(true);
  };

  const handleRecordUpdated = () => {
    setIsLoading(true);
    setFetchTrigger((c) => c + 1);
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <AttendanceHistoryFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        classes={initialClasses}
        subjects={initialSubjects}
        students={initialStudents}
        userRole={userRole}
        isSearching={isLoading}
      />

      {/* History Table with Live Metrics */}
      <AttendanceHistoryTable
        records={records}
        pagination={pagination}
        summary={summary}
        onPageChange={handlePageChange}
        onViewDetails={handleViewDetails}
        onEditRecord={handleEditRecord}
        userRole={userRole}
        isLoading={isLoading}
      />

      {/* Record Detail Modal */}
      <AttendanceRecordDetailModal
        record={selectedRecord}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRecord(null);
        }}
        userRole={userRole}
      />

      {/* Edit Record Modal */}
      <AttendanceEditDialog
        record={editingRecord}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={handleRecordUpdated}
        userRole={userRole}
      />
    </div>
  );
}
