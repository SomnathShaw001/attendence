import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

interface StudentDashboardViewProps {
  data: {
    student: {
      id: string;
      rollNo: string;
      batch: string;
      department: string;
      admissionYear: number;
      user: {
        name: string;
        email: string;
        image: string | null;
      };
    } | null;
    enrollments: Array<{
      id: string;
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
        teachers: Array<{
          teacher: {
            user: {
              name: string;
              email: string;
            };
          };
        }>;
      };
    }>;
    attendanceRecords: Array<{
      id: string;
      status: string;
      remarks: string | null;
      createdAt: Date;
      classSession: {
        date: Date;
        subject: {
          code: string;
          name: string;
        };
        teacher: {
          user: {
            name: string;
          };
        };
      };
    }>;
    stats: {
      totalRecords: number;
      attendedCount: number;
      percentage: number | null;
      minThreshold: number;
      isDebarmentRisk: boolean;
    };
  };
}

export function StudentDashboardView({ data }: StudentDashboardViewProps) {
  const { student, enrollments, attendanceRecords, stats } = data;

  if (!student) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Student Profile Not Found"
        description="Your user account does not have a linked student profile. Please contact the academic registry to enroll your profile."
      />
    );
  }

  const { percentage, minThreshold, isDebarmentRisk, totalRecords, attendedCount } = stats;

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hello, {student.user.name}
            </h2>
            <Badge variant="success">Student Portal</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Roll No: <span className="font-semibold text-slate-700">{student.rollNo}</span> • Batch:{" "}
            <span className="font-semibold text-slate-700">{student.batch}</span> • Department of{" "}
            {student.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/attendance">
            <Button variant="outline" size="md">
              <Calendar className="h-4 w-4 mr-2" />
              My Attendance History
            </Button>
          </Link>
        </div>
      </div>

      {/* Attendance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Attendance Score Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cumulative Attendance Status</CardTitle>
              {percentage !== null ? (
                isDebarmentRisk ? (
                  <Badge variant="danger" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Debarment Warning (&lt;{minThreshold}%)
                  </Badge>
                ) : (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Good Standing (&gt;={minThreshold}%)
                  </Badge>
                )
              ) : (
                <Badge variant="outline">No Sessions Held</Badge>
              )}
            </div>
            <CardDescription>
              Calculated against the {minThreshold}% mandatory institutional requirement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {percentage !== null ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {percentage}%
                  </span>
                  <span className="text-xs text-slate-500">
                    ({attendedCount} attended out of {totalRecords} total lectures)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDebarmentRisk ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>0%</span>
                    <span className="text-indigo-600 font-semibold">Requirement: {minThreshold}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {isDebarmentRisk ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700 leading-relaxed">
                    <strong>Warning:</strong> Your cumulative attendance is below the mandatory {minThreshold}%
                    institutional threshold. Maintain regular lecture attendance to avoid semester exam
                    debarment.
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Your attendance is on track. Continue attending regular lecture and lab sessions to maintain
                    your academic eligibility.
                  </p>
                )}
              </>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="No Attendance Data Recorded"
                description="Your instructors have not recorded attendance entries for your enrolled classes yet. Your cumulative percentage will calculate automatically once classes begin."
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Academic Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Summary</CardTitle>
            <CardDescription>Enrollment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Enrolled Courses
              </span>
              <p className="text-lg font-bold text-slate-900">{enrollments.length} Subjects</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Admission Year
              </span>
              <p className="text-lg font-bold text-slate-900">{student.admissionYear}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                Lectures Attended
              </span>
              <p className="text-lg font-bold text-slate-900">
                {attendedCount} / {totalRecords}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Enrolled Courses</CardTitle>
              <CardDescription>Classes and faculty instructors assigned to your student cohort</CardDescription>
            </div>
            <Link href="/classes">
              <Button variant="ghost" size="sm">
                <span>View Timetable</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-600">
                        {item.class.subject.code}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-semibold">
                        {item.class.subject.credits} Credits
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {item.class.subject.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {item.class.name} • Section {item.class.section}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
                    <span>
                      {item.class.teachers[0]?.teacher.user.name
                        ? `Instructor: ${item.class.teachers[0].teacher.user.name}`
                        : "Faculty TBA"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No Enrolled Classes Found"
              description="Your student profile is not currently enrolled in any class cohorts. Once class registration is completed, your subjects and lecture timetables will display here."
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Attendance History</CardTitle>
              <CardDescription>Latest individual roll call statuses recorded for your profile</CardDescription>
            </div>
            <Link href="/attendance">
              <Button variant="outline" size="sm">
                <span>All Records</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
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
                      <span className="text-xs font-semibold text-slate-900">
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
                      Conducted by: {record.classSession.teacher.user.name}
                      {record.remarks && ` • Note: ${record.remarks}`}
                    </p>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(record.classSession.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Attendance Logs Found"
              description="No attendance records have been filed for your profile yet. Statuses (Present, Absent, Late, Excused) will appear here after each lecture."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
