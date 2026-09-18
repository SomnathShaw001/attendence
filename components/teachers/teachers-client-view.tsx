"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherTable, type TeacherRecord } from "./teacher-table";
import { TeacherFilters } from "./teacher-filters";
import { TeacherDialog } from "./teacher-dialog";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Users,
  UserCheck,
  Building2,
  Presentation,
} from "lucide-react";

interface FacultyStats {
  total: number;
  active: number;
  totalSessions: number;
}

interface TeachersClientViewProps {
  teachers: TeacherRecord[];
  departments: string[];
  stats: FacultyStats;
}

export function TeachersClientView({
  teachers,
  departments,
  stats,
}: TeachersClientViewProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<TeacherRecord | null>(null);

  const handleOpenAdd = () => {
    setTeacherToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (teacher: TeacherRecord) => {
    setTeacherToEdit(teacher);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTeacherToEdit(null);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Faculty Directory & Allocations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage professorial appointments, departmental allocations, and teaching credentials.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0 gap-1.5 text-xs h-9">
          <UserPlus className="h-4 w-4" />
          Add Faculty Member
        </Button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faculty */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Faculty</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.total}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Registered academic staff</p>
        </div>

        {/* Active Faculty */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Faculty</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.active}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Eligible to record attendance</p>
        </div>

        {/* Departments */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Departments</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{departments.length}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active academic disciplines</p>
        </div>

        {/* Total Sessions Conducted */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Conducted Sessions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Presentation className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{stats.totalSessions}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Institutional lectures & labs</p>
        </div>
      </div>

      {/* Filter Bar */}
      <TeacherFilters departments={departments} />

      {/* Roster Table */}
      <TeacherTable
        teachers={teachers}
        onEdit={handleOpenEdit}
        onRefresh={handleSuccess}
      />

      {/* Add / Edit Dialog */}
      <TeacherDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        teacherToEdit={
          teacherToEdit
            ? {
                id: teacherToEdit.id,
                employeeId: teacherToEdit.employeeId,
                department: teacherToEdit.department,
                designation: teacherToEdit.designation,
                user: {
                  name: teacherToEdit.user.name,
                  email: teacherToEdit.user.email,
                },
              }
            : null
        }
      />
    </div>
  );
}
