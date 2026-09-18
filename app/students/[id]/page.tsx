import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { getStudentById } from "@/app/students/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Mail,
} from "lucide-react";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  let student;
  try {
    student = await getStudentById(id);
  } catch {
    notFound();
  }

  const { stats, enrollments, attendanceRecords } = student;
  const isDebarmentRisk = stats.percentage !== null && stats.percentage < 75.0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/students">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Student Directory
            </Button>
          </Link>
        </div>

        {/* Profile Dossier Header */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-2xs">
              {student.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {student.user.name}
                </h2>
                {student.user.isActive ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </Badge>
                ) : (
                  <Badge variant="danger" className="gap-1">
                    <XCircle className="h-3 w-3" /> Deactivated
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="font-mono font-semibold text-slate-700">
                  Roll: {student.rollNo}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {student.user.email}
                </span>
                <span>•</span>
                <span>Batch: {student.batch}</span>
                <span>•</span>
                <span>Dept: {student.department}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Registered: {formatDate(student.user.createdAt)}
            </span>
          </div>
        </div>

        {/* Attendance Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Attendance
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {stats.percentage !== null ? `${stats.percentage}%` : "—"}
                </span>
                {stats.percentage !== null && (
                  <Badge variant={isDebarmentRisk ? "danger" : "success"}>
                    {isDebarmentRisk ? "Debarment Risk" : "Eligible"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Institutional requirement: 75%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lectures Attended
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {stats.attended}
                </span>
                <span className="text-xs text-slate-400 font-medium">of {stats.total} total</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Present or excused sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enrolled Courses
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {enrollments.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">Subjects</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Class registrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Course Enrolments</CardTitle>
            <CardDescription>Academic classes assigned to this student profile</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrollments.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600">
                        {item.class.subject.code}
                      </span>
                      <Badge variant="outline">{item.class.term.name}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-900">{item.class.subject.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.class.name} • Section {item.class.section}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Course Enrolments"
                description="This student is not enrolled in any academic courses for the active term."
              />
            )}
          </CardContent>
        </Card>

        {/* Attendance Records History */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Log</CardTitle>
            <CardDescription>Chronological roll call entries recorded for this student</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {record.classSession.subject.code} — {record.classSession.subject.name}
                        </span>
                        <Badge
                          variant={
                            record.status === "PRESENT"
                              ? "success"
                              : record.status === "LATE"
                              ? "warning"
                              : record.status === "EXCUSED"
                              ? "default"
                              : "danger"
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Instructor: {record.classSession.teacher.user.name}
                        {record.remarks && ` • Remarks: ${record.remarks}`}
                      </p>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(record.classSession.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No Attendance Records Logged"
                description="No individual attendance entries have been posted for this student yet."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
