import Link from "next/link";
import {
  Users,
  GraduationCap,
  BookOpen,
  FolderKanban,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Clock,
  Settings as SettingsIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

interface AdminDashboardViewProps {
  data: {
    studentCount: number;
    teacherCount: number;
    classCount: number;
    subjectCount: number;
    currentTerm: {
      name: string;
      startDate: Date;
      endDate: Date;
      isCurrent: boolean;
    } | null;
    minAttendanceThreshold: number;
    recentAuditLogs: Array<{
      id: string;
      entity: string;
      action: string;
      createdAt: Date;
      performedBy: {
        name: string;
        email: string;
        role: string;
      } | null;
    }>;
  };
}

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  const {
    studentCount,
    teacherCount,
    classCount,
    subjectCount,
    currentTerm,
    minAttendanceThreshold,
    recentAuditLogs,
  } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Console</h2>
            <Badge variant="default">System Administrator</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Global institution metrics, academic term operations, and administrative registry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="md">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Policy Settings
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="primary" size="md">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Compliance Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Students
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{studentCount}</span>
              <span className="text-xs text-slate-400 font-medium">Registered</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Institutional student roster</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Faculty
              </span>
              <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{teacherCount}</span>
              <span className="text-xs text-slate-400 font-medium">Active</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Teaching and lab staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Classes
              </span>
              <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <FolderKanban className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{classCount}</span>
              <span className="text-xs text-slate-400 font-medium">Cohorts</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Class sections this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Courses / Subjects
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{subjectCount}</span>
              <span className="text-xs text-slate-400 font-medium">Catalog</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Accredited subject offerings</p>
          </CardContent>
        </Card>
      </div>

      {/* Term & Policy Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <CardTitle>Academic Term Information</CardTitle>
              </div>
              {currentTerm?.isCurrent && <Badge variant="success">Current Term</Badge>}
            </div>
            <CardDescription>Active term dates and calendar configuration</CardDescription>
          </CardHeader>
          <CardContent>
            {currentTerm ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{currentTerm.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(currentTerm.startDate)} — {formatDate(currentTerm.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium">
                      Status: Active
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No Active Academic Term"
                description="There is currently no academic term marked as active. Please configure the term in Settings."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Institutional Thresholds</CardTitle>
            <CardDescription>Debarment and eligibility policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Min. Attendance Requirement</span>
                <span className="text-sm font-bold text-slate-900">{minAttendanceThreshold}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${minAttendanceThreshold}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Students dropping below {minAttendanceThreshold}% receive automated debarment risk alerts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Audit Trail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Audit Log</CardTitle>
              <CardDescription>Recent administrative actions and attendance integrity events</CardDescription>
            </div>
            <Link href="/audit-logs">
              <Button variant="ghost" size="sm">
                <span>View Full Log</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentAuditLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">
                      {log.action} on {log.entity}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      By: {log.performedBy?.name || "System"} ({log.performedBy?.email || "internal"})
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="No Audit Logs Recorded Yet"
              description="System actions, attendance modifications, and permission overrides will automatically appear in this immutable audit stream."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
