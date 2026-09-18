"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  BookOpen,
  Users,
  Presentation,
  UserCheck,
} from "lucide-react";
import { deleteClass } from "@/app/classes/actions";

export interface ClassItem {
  id: string;
  name: string;
  section: string;
  subjectId: string;
  termId: string;
  subject: {
    id: string;
    code: string;
    name: string;
    credits: number;
    department: string;
  };
  term: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  teachers: Array<{
    id: string;
    role: string;
    teacher: {
      id: string;
      employeeId: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
    };
  }>;
  _count: {
    enrollments: number;
    classSessions: number;
  };
}

interface ClassTableProps {
  classes: ClassItem[];
  isAdmin: boolean;
  onEdit: (classItem: ClassItem) => void;
  onRefresh: () => void;
}

export function ClassTable({ classes, isAdmin, onEdit, onRefresh }: ClassTableProps) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const handleDelete = (classItem: ClassItem) => {
    const confirm = window.confirm(
      `Are you sure you want to delete class section "${classItem.name}" (Sec ${classItem.section})?\n\nIf attendance sessions have been conducted, deletion will be blocked to maintain academic records.`
    );
    if (!confirm) return;

    setActionError(null);
    setActiveClassId(classItem.id);

    startTransition(async () => {
      try {
        const res = await deleteClass(classItem.id);
        if (!res.success) {
          setActionError(res.error || "Failed to delete class.");
        } else {
          onRefresh();
        }
      } catch {
        setActionError("An unexpected error occurred while deleting the class.");
      } finally {
        setActiveClassId(null);
      }
    });
  };

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
          <BookOpen className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Academic Classes Found</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          No class sections match the active search or filters, or no courses have been scheduled for this semester.
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
              <th className="px-5 py-3.5">Class Cohort & Section</th>
              <th className="px-4 py-3.5">Course Subject</th>
              <th className="px-4 py-3.5">Academic Term</th>
              <th className="px-4 py-3.5">Assigned Faculty</th>
              <th className="px-4 py-3.5">Enrollment</th>
              <th className="px-4 py-3.5">Sessions</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {classes.map((cls) => {
              const isItemBusy = isPending && activeClassId === cls.id;

              return (
                <tr key={cls.id} className="hover:bg-muted/30 transition-colors duration-100">
                  {/* Class Name & Section */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div>
                      <Link
                        href={`/classes/${cls.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        {cls.name}
                      </Link>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        Section: <span className="font-mono font-medium text-foreground">{cls.section}</span>
                      </div>
                    </div>
                  </td>

                  {/* Course Subject */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-medium text-foreground">{cls.subject.name}</div>
                    <div className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                      <span className="font-mono bg-muted/60 px-1.5 py-0.2 rounded font-medium text-foreground">
                        {cls.subject.code}
                      </span>
                      <span>•</span>
                      <span>{cls.subject.credits} Credits</span>
                    </div>
                  </td>

                  {/* Academic Term */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                      {cls.term.name}
                    </span>
                  </td>

                  {/* Assigned Faculty */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {cls.teachers.length === 0 ? (
                      <span className="text-muted-foreground text-[11px] italic">Unassigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {cls.teachers.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                            title={`${t.teacher.user.name} (${t.role})`}
                          >
                            <UserCheck className="h-3 w-3" />
                            {t.teacher.user.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Enrolled Students */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      {cls._count.enrollments}
                    </span>
                  </td>

                  {/* Conducted Sessions */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Presentation className="h-3.5 w-3.5 text-purple-500" />
                      {cls._count.classSessions}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Dossier */}
                      <Link
                        href={`/classes/${cls.id}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View Class Dossier & Enrollments"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      {isAdmin && (
                        <>
                          {/* Edit */}
                          <button
                            onClick={() => onEdit(cls)}
                            disabled={isItemBusy}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Edit Class Section"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(cls)}
                            disabled={isItemBusy}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Delete Class (Guarded)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
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
