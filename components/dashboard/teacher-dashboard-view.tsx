import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Calendar,
  Users,
  GraduationCap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

interface TeacherDashboardViewProps {
  data: {
    teacher: {
      id: string;
      employeeId: string;
      department: string;
      designation: string | null;
      user: {
        name: string;
        email: string;
        image: string | null;
      };
    } | null;
    assignedClasses: Array<{
      id: string;
      role: string;
      class: {
        id: string;
        name: string;
        section: string;
        subject: {
          code: string;
          name: string;
          credits: number;
        };
        term: {
          name: string;
        };
        _count: {
          enrollments: number;
          classSessions: number;
        };
      };
    }>;
    recentSessions: Array<{
      id: string;
      date: Date;
      startTime: string | null;
      endTime: string | null;
      room: string | null;
      status: string;
      verifiedAt: Date | null;
      class: {
        name: string;
      };
      subject: {
        code: string;
        name: string;
      };
      _count: {
        records: number;
      };
    }>;
  };
}

export function TeacherDashboardView({ data }: TeacherDashboardViewProps) {
  const { teacher, assignedClasses, recentSessions } = data;

  if (!teacher) {
    return (
      <EmptyState
        icon={Users}
        title="Faculty Profile Not Initialized"
        description="Your user account does not have a linked teacher profile in the database. Please contact your institutional administrator."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Faculty Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {teacher.user.name}
            </h2>
            <Badge variant="warning">Faculty Portal</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {teacher.designation || "Faculty Member"} • Department of {teacher.department} • Employee ID:{" "}
            {teacher.employeeId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/attendance">
            <Button variant="primary" size="md">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Take Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned Classes
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{assignedClasses.length}</span>
              <span className="text-xs text-slate-400 font-medium">Cohorts</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Under your instruction</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Enrolled Students
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {assignedClasses.reduce((acc, curr) => acc + curr.class._count.enrollments, 0)}
              </span>
              <span className="text-xs text-slate-400 font-medium">Students</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Across all assigned cohorts</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Recorded Sessions
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{recentSessions.length}</span>
              <span className="text-xs text-slate-400 font-medium">Lectures</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Conducted this semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Classes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Assigned Courses & Classes</CardTitle>
              <CardDescription>Academic courses allocated to your faculty schedule</CardDescription>
            </div>
            <Link href="/classes">
              <Button variant="ghost" size="sm">
                <span>View All Classes</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {assignedClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedClasses.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-600">
                        {item.class.subject.code}
                      </span>
                      <Badge variant="outline">{item.role}</Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {item.class.subject.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {item.class.name} • Section {item.class.section} • {item.class.term.name}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {item.class._count.enrollments} Students
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {item.class._count.classSessions} Sessions Held
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No Classes Assigned Yet"
              description="You have not been assigned to any course offerings for the current term. Once the administrator allocates subjects to your profile, they will appear here."
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Lectures & Attendance Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Lectures & Session Verification</CardTitle>
              <CardDescription>Attendance roll calls conducted for your classes</CardDescription>
            </div>
            <Link href="/attendance">
              <Button variant="outline" size="sm">
                <span>Open Attendance Sheet</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentSessions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentSessions.map((session) => (
                <div key={session.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {session.subject.code} — {session.subject.name}
                      </span>
                      <Badge
                        variant={
                          session.status === "COMPLETED"
                            ? "success"
                            : session.status === "SCHEDULED"
                            ? "warning"
                            : "default"
                        }
                      >
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      {session.class.name} • {session.room ? `Room ${session.room}` : "Classroom"}{" "}
                      {session.startTime && `• ${session.startTime} - ${session.endTime}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {session._count.records} Students Recorded
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(session.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Class Sessions Scheduled"
              description="No lecture sessions have been scheduled or recorded yet. Use the 'Take Attendance' button to begin recording session rosters."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
