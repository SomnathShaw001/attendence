import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { getTeacherById } from "@/app/teachers/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  Mail,
  Building2,
  Presentation,
} from "lucide-react";

interface TeacherDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Role guard: Only Admins can view complete faculty dossiers
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  const { id } = await params;

  let teacher;
  try {
    teacher = await getTeacherById(id);
  } catch {
    notFound();
  }

  const { user, assignments, classSessions } = teacher;

  // Calculate total students managed across all assigned classes
  const totalStudentsManaged = assignments.reduce(
    (acc, curr) => acc + (curr.class._count?.enrollments || 0),
    0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/teachers">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Faculty Directory
            </Button>
          </Link>
        </div>

        {/* Profile Dossier Header */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-2xs">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {user.name}
                </h2>
                {user.isActive ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active Faculty
                  </Badge>
                ) : (
                  <Badge variant="danger" className="gap-1">
                    <XCircle className="h-3 w-3" /> Deactivated
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-foreground">
                  ID: {teacher.employeeId}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {teacher.department}
                </span>
                <span>•</span>
                <span className="font-medium text-foreground">
                  {teacher.designation || "Faculty Member"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Appointed: {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Workload Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Classes
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {assignments.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">courses</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Teaching & lab allocations</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sessions Delivered
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {classSessions.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">recorded</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Lectures & practicals conducted</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Students Managed
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-foreground">
                  {totalStudentsManaged}
                </span>
                <span className="text-xs text-muted-foreground font-medium">enrolled</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all assigned sections</p>
            </CardContent>
          </Card>
        </div>

        {/* Course Assignments List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Assigned Academic Classes</CardTitle>
                <CardDescription className="text-xs">
                  Course sections, laboratory groups, and instructional responsibilities.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Classes Assigned"
                description="This faculty member has not been assigned to any course sections or laboratory batches yet."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Class & Section</th>
                      <th className="px-4 py-3">Academic Term</th>
                      <th className="px-4 py-3">Teaching Role</th>
                      <th className="px-4 py-3 text-right">Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">
                            {assignment.class.subject.name}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {assignment.class.subject.code} • {assignment.class.subject.credits} Credits
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {assignment.class.name} (Sec {assignment.class.section})
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {assignment.class.term.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {assignment.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {assignment.class._count?.enrollments || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Class Sessions & Attendance Delivery */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <CardTitle className="text-base">Recent Conducted Sessions</CardTitle>
                <CardDescription className="text-xs">
                  Historical lecture delivery logs and attendance submission timeline.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {classSessions.length === 0 ? (
              <EmptyState
                icon={Presentation}
                title="No Teaching Sessions Conducted Yet"
                description="Lectures, practicals, and attendance submissions will appear here once sessions are recorded."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/30 font-medium text-muted-foreground uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Class</th>
                      <th className="px-4 py-3">Venue / Room</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Attendance Records</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classSessions.map((sessionItem) => (
                      <tr key={sessionItem.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-foreground">
                            {formatDate(sessionItem.date)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {sessionItem.startTime || "N/A"} - {sessionItem.endTime || "N/A"}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {sessionItem.subject.name} ({sessionItem.subject.code})
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sessionItem.class.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sessionItem.room || "Regular Classroom"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              sessionItem.status === "COMPLETED"
                                ? "success"
                                : sessionItem.status === "CANCELLED"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {sessionItem.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {sessionItem._count.records} logs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
