"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Edit2,
  Power,
  Trash2,
  GraduationCap,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentDialog } from "@/components/students/student-dialog";
import { toggleStudentStatus, deleteStudent } from "@/app/students/actions";

export interface StudentListItem {
  id: string;
  rollNo: string;
  batch: string;
  department: string;
  admissionYear: number;
  user: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    image: string | null;
    createdAt: Date;
  };
  _count: {
    enrollments: number;
    attendanceRecords: number;
  };
}

interface StudentTableProps {
  students: StudentListItem[];
  isAdmin: boolean;
}

export function StudentTable({ students, isAdmin }: StudentTableProps) {
  const router = useRouter();

  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleToggleStatus = async (student: StudentListItem) => {
    const actionLabel = student.user.isActive ? "deactivate" : "reactivate";
    if (
      !confirm(
        `Are you sure you want to ${actionLabel} ${student.user.name} (${student.rollNo})?`
      )
    ) {
      return;
    }

    setLoadingActionId(student.id);
    setActionError("");

    try {
      await toggleStudentStatus(student.id);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Failed to update student status.");
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDelete = async (student: StudentListItem) => {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY delete student ${student.user.name} (${student.rollNo})? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoadingActionId(student.id);
    setActionError("");

    try {
      await deleteStudent(student.id);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError("Failed to delete student.");
      }
    } finally {
      setLoadingActionId(null);
    }
  };

  if (students.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No Students Found"
        description="No student records match the active search or filter criteria. Try adjusting your search query or reset the filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3.5 px-4">Roll Number</th>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Batch</th>
              <th className="py-3.5 px-4 hidden lg:table-cell">Department</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 hidden sm:table-cell text-center">Records</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {students.map((student) => {
              const isActionLoading = loadingActionId === student.id;

              return (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/80 transition-colors duration-100"
                >
                  {/* Roll Number */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <Link
                      href={`/students/${student.id}`}
                      className="hover:text-indigo-600 transition-colors"
                    >
                      {student.rollNo}
                    </Link>
                  </td>

                  {/* Name & Email */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <Link
                        href={`/students/${student.id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block"
                      >
                        {student.user.name}
                      </Link>
                      <span className="text-[11px] text-slate-400 block">{student.user.email}</span>
                    </div>
                  </td>

                  {/* Batch */}
                  <td className="py-3.5 px-4 hidden md:table-cell font-medium text-slate-700">
                    {student.batch}
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-slate-600">
                    {student.department}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {student.user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                        <XCircle className="h-3 w-3" />
                        Deactivated
                      </span>
                    )}
                  </td>

                  {/* Enrollment & Attendance stats */}
                  <td className="py-3.5 px-4 hidden sm:table-cell text-center text-slate-500">
                    <span title="Attendance Records">
                      {student._count.attendanceRecords} lectures
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/students/${student.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                          title="View Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>

                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                            title="Edit Student"
                            onClick={() => {
                              setEditingStudent(student);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isActionLoading}
                            className={`h-8 w-8 ${
                              student.user.isActive
                                ? "text-slate-400 hover:text-amber-600"
                                : "text-amber-600 hover:text-emerald-600"
                            }`}
                            title={
                              student.user.isActive
                                ? "Deactivate Account"
                                : "Reactivate Account"
                            }
                            onClick={() => handleToggleStatus(student)}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isActionLoading}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600"
                            title="Delete Student (Allowed only if 0 records exist)"
                            onClick={() => handleDelete(student)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Edit Student Dialog */}
      {editingStudent && (
        <StudentDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingStudent(null);
          }}
          onSuccess={() => {
            router.refresh();
          }}
          studentToEdit={editingStudent}
        />
      )}
    </div>
  );
}
