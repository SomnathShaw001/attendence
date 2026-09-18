"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ExternalLink,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Presentation,
} from "lucide-react";
import { toggleTeacherStatus, deleteTeacher } from "@/app/teachers/actions";

export interface TeacherRecord {
  id: string;
  employeeId: string;
  department: string;
  designation: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    image: string | null;
    createdAt: Date;
  };
  _count: {
    assignments: number;
    classSessions: number;
  };
}

interface TeacherTableProps {
  teachers: TeacherRecord[];
  onEdit: (teacher: TeacherRecord) => void;
  onRefresh: () => void;
}

export function TeacherTable({ teachers, onEdit, onRefresh }: TeacherTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);

  const handleToggleStatus = (teacher: TeacherRecord) => {
    setActionError(null);
    setActiveTeacherId(teacher.id);

    startTransition(async () => {
      try {
        const res = await toggleTeacherStatus(teacher.id, !teacher.user.isActive);
        if (!res.success) {
          setActionError(res.error || "Failed to update faculty account status.");
        } else {
          onRefresh();
        }
      } catch {
        setActionError("An unexpected error occurred.");
      } finally {
        setActiveTeacherId(null);
      }
    });
  };

  const handleDelete = (teacher: TeacherRecord) => {
    const confirm = window.confirm(
      `Are you sure you want to remove faculty record "${teacher.user.name}" (${teacher.employeeId})?\n\nIf class sessions exist, deletion will be blocked to preserve attendance audit records.`
    );
    if (!confirm) return;

    setActionError(null);
    setActiveTeacherId(teacher.id);

    startTransition(async () => {
      try {
        const res = await deleteTeacher(teacher.id);
        if (!res.success) {
          setActionError(res.error || "Failed to remove faculty member.");
        } else {
          onRefresh();
        }
      } catch {
        setActionError("An unexpected error occurred while deleting faculty.");
      } finally {
        setActiveTeacherId(null);
      }
    });
  };

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <BookOpen className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Faculty Members Found</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          No faculty members match the active filters, or no faculty profiles have been provisioned yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-5 py-3.5">Faculty Member</th>
              <th className="px-4 py-3.5">Employee ID</th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">Designation</th>
              <th className="px-4 py-3.5">Workload</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teachers.map((teacher) => {
              const isItemBusy = isPending && activeTeacherId === teacher.id;
              const initials = teacher.user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <tr
                  key={teacher.id}
                  className="hover:bg-muted/30 transition-colors duration-100"
                >
                  {/* Name & Email */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {teacher.user.name}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {teacher.user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Employee ID */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-mono font-medium text-foreground bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                      {teacher.employeeId}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                      {teacher.department}
                    </span>
                  </td>

                  {/* Designation */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-foreground font-medium">
                    {teacher.designation || "Faculty"}
                  </td>

                  {/* Workload */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-[11px]" title="Assigned Classes">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-foreground">{teacher._count.assignments}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px]" title="Conducted Sessions">
                        <Presentation className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-semibold text-foreground">{teacher._count.classSessions}</span>
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {teacher.user.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <Power className="h-3 w-3" />
                        Deactivated
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Dossier */}
                      <Link
                        href={`/teachers/${teacher.id}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View Full Dossier"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(teacher)}
                        disabled={isItemBusy}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* Toggle Active / Deactivate */}
                      <button
                        onClick={() => handleToggleStatus(teacher)}
                        disabled={isItemBusy}
                        className={`rounded-md p-1.5 transition-colors ${
                          teacher.user.isActive
                            ? "text-amber-500 hover:bg-amber-500/10 hover:text-amber-600"
                            : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                        }`}
                        title={teacher.user.isActive ? "Deactivate Account" : "Reactivate Account"}
                      >
                        {isItemBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>

                      {/* Safe Delete */}
                      <button
                        onClick={() => handleDelete(teacher)}
                        disabled={isItemBusy}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        title="Delete Faculty (Guarded)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
