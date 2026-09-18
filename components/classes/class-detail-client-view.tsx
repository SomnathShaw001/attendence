"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { ClassAssignmentDialog } from "./class-assignment-dialog";
import { ClassEnrollmentDialog } from "./class-enrollment-dialog";
import { removeTeacherFromClass, unenrollStudentFromClass } from "@/app/classes/actions";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Presentation,
  UserCheck,
  UserPlus,
  Trash2,
  AlertTriangle,
  Mail,
  Search,
} from "lucide-react";

interface TeacherAssignment {
  id: string;
  role: string;
  assignedAt: Date;
  teacher: {
    id: string;
    employeeId: string;
    user: {
      name: string;
      email: string;
      isActive: boolean;
    };
  };
}

interface StudentEnrollment {
  id: string;
  enrolledAt: Date;
  student: {
    id: string;
    rollNo: string;
    batch: string;
    department: string;
    user: {
      name: string;
      email: string;
      isActive: boolean;
    };
  };
}

interface ClassSessionItem {
  id: string;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  status: string;
  teacher: {
    user: {
      name: string;
    };
  };
  _count: {
    records: number;
  };
}

interface ClassDetailClientViewProps {
  classRecord: {
    id: string;
    name: string;
    section: string;
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
    teachers: TeacherAssignment[];
    enrollments: StudentEnrollment[];
    classSessions: ClassSessionItem[];
  };
  availableTeachers: Array<{
    id: string;
    employeeId: string;
    department: string;
    user: { name: string; email: string };
  }>;
  availableStudents: Array<{
    id: string;
    rollNo: string;
    batch: string;
    department: string;
    user: { name: string; email: string };
  }>;
  availableBatches?: string[];
  availableDepartments?: string[];
  isAdmin: boolean;
}

export function ClassDetailClientView({
  classRecord,
  availableTeachers,
  availableStudents,
  availableBatches = [],
  availableDepartments = [],
  isAdmin,
}: ClassDetailClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const handleUnassignTeacher = (teacherId: string, teacherName: string) => {
    const confirm = window.confirm(`Remove faculty assignment for "${teacherName}"?`);
    if (!confirm) return;

    setActionError(null);
    startTransition(async () => {
      try {
        const res = await removeTeacherFromClass(classRecord.id, teacherId);
        if (!res.success) {
          setActionError(res.error || "Failed to remove faculty assignment.");
        } else {
          router.refresh();
        }
      } catch {
        setActionError("An unexpected error occurred.");
      }
    });
  };

  const handleUnenrollStudent = (studentId: string, studentName: string) => {
    const confirm = window.confirm(`Unenroll student "${studentName}" from this class?`);
    if (!confirm) return;

    setActionError(null);
    startTransition(async () => {
      try {
        const res = await unenrollStudentFromClass(classRecord.id, studentId);
        if (!res.success) {
          setActionError(res.error || "Failed to unenroll student.");
        } else {
          router.refresh();
        }
      } catch {
        setActionError("An unexpected error occurred.");
      }
    });
  };

  const filteredEnrollments = classRecord.enrollments.filter((e) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      e.student.rollNo.toLowerCase().includes(q) ||
      e.student.user.name.toLowerCase().includes(q) ||
      e.student.batch.toLowerCase().includes(q) ||
      e.student.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div>
        <Link href="/classes">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Class Directory
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-2xs">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {classRecord.name}
              </h2>
              <Badge variant="outline" className="font-mono text-xs font-semibold">
                Section {classRecord.section}
              </Badge>
              {classRecord.term.isCurrent && (
                <Badge variant="success">Current Term</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {classRecord.subject.name}
              </span>
              <span>•</span>
              <span className="font-mono bg-muted/60 px-1.5 py-0.2 rounded font-medium text-foreground">
                {classRecord.subject.code}
              </span>
              <span>•</span>
              <span>{classRecord.subject.credits} Credits</span>
              <span>•</span>
              <span>{classRecord.term.name}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              className="gap-1.5 text-xs"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Assign Faculty
            </Button>
            <Button
              size="sm"
              onClick={() => setIsEnrollOpen(true)}
              className="gap-1.5 text-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Enroll Student
            </Button>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {classRecord.enrollments.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium">registered</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Students tracking attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Assigned Faculty
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {classRecord.teachers.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium">instructors</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Primary & lab faculty</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Conducted Sessions
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-foreground">
                {classRecord.classSessions.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium">lectures</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Class sessions held</p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Assigned Faculty Instructors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Assigned Faculty Instructors</CardTitle>
                <CardDescription className="text-xs">
                  Teachers authorized to conduct sessions and record student attendance.
                </CardDescription>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Assign Instructor
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {classRecord.teachers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No Faculty Assigned"
              description="Assign an instructor to allow attendance marking for this class section."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/30 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Faculty Member</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Instructional Role</th>
                    <th className="px-4 py-3">Assigned Date</th>
                    {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classRecord.teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {t.teacher.user.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {t.teacher.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-foreground">
                        {t.teacher.employeeId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(t.assignedAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              handleUnassignTeacher(t.teacher.id, t.teacher.user.name)
                            }
                            disabled={isPending}
                            className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Remove Faculty Assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Enrolled Student Cohort */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle className="text-base">Enrolled Student Cohort</CardTitle>
                <CardDescription className="text-xs">
                  Students enrolled in this section for roll calls and debarment monitoring.
                </CardDescription>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEnrollOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Enroll Student
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {classRecord.enrollments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Students Enrolled"
              description="Enroll students to populate the attendance register for this course."
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter enrolled roster..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Showing {filteredEnrollments.length} of {classRecord.enrollments.length} students
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Roll Number</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Batch & Dept</th>
                      <th className="px-4 py-3">Enrolled Date</th>
                      {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredEnrollments.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-medium text-foreground">
                        {e.student.rollNo}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/students/${e.student.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {e.student.user.name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">
                          {e.student.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.student.department} • Batch {e.student.batch}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(e.enrolledAt)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              handleUnenrollStudent(e.student.id, e.student.user.name)
                            }
                            disabled={isPending}
                            className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Unenroll Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Conducted Class Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div>
              <CardTitle className="text-base">Conducted Teaching Sessions</CardTitle>
              <CardDescription className="text-xs">
                Chronological lectures, laboratories, and attendance record volumes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {classRecord.classSessions.length === 0 ? (
            <EmptyState
              icon={Presentation}
              title="No Sessions Conducted"
              description="Class sessions and attendance rosters will appear here once teaching begins."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/30 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Instructor</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Attendance Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classRecord.classSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {formatDate(s.date)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.startTime || "N/A"} - {s.endTime || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {s.teacher.user.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.room || "Regular Classroom"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            s.status === "COMPLETED"
                              ? "success"
                              : s.status === "CANCELLED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        {s._count.records} entries
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {isAdmin && (
        <>
          <ClassAssignmentDialog
            isOpen={isAssignOpen}
            onClose={() => setIsAssignOpen(false)}
            onSuccess={() => router.refresh()}
            classId={classRecord.id}
            availableTeachers={availableTeachers}
          />
          <ClassEnrollmentDialog
            isOpen={isEnrollOpen}
            onClose={() => setIsEnrollOpen(false)}
            onSuccess={() => router.refresh()}
            classId={classRecord.id}
            availableStudents={availableStudents}
            availableBatches={availableBatches}
            availableDepartments={availableDepartments}
          />
        </>
      )}
    </div>
  );
}
