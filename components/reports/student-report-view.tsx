"use client";

import React from "react";
import { StudentReportItem } from "@/app/reports/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";

interface StudentReportViewProps {
  data: StudentReportItem;
}

export function StudentReportView({ data }: StudentReportViewProps) {
  const { student, summary, subjectBreakdown, records } = data;

  return (
    <div className="space-y-6">
      {/* Student Profile Header Banner */}
      <Card className="border-border/70 shadow-sm bg-gradient-to-r from-muted/40 via-background to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                {student.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                  <Badge variant="outline" className="font-mono text-xs">
                    {student.rollNo}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {student.department} &bull; Batch: {student.batch} &bull; {student.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge
                variant={summary.isBelowThreshold ? "danger" : "success"}
                className="text-xs px-3 py-1 font-semibold"
              >
                {summary.isBelowThreshold
                  ? `Below ${summary.threshold}% Target`
                  : `Good Standing (${summary.threshold}%+)`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Attendance Rate</span>
            <p className="text-2xl font-bold mt-1 text-foreground">
              {summary.overallPercentage !== null ? `${summary.overallPercentage.toFixed(1)}%` : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Total Sessions</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Present</span>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {summary.attendedSessions}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Absent</span>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {summary.absentSessions}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Late</span>
            <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {summary.lateSessions}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-sky-600 dark:text-sky-400">Excused</span>
            <p className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">
              {summary.excusedSessions}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Subject Attendance Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Performance breakdown across enrolled course subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjectBreakdown.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No course subjects recorded for this student in selected timeframe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold text-center">Total</th>
                    <th className="pb-3 font-semibold text-center text-emerald-600 dark:text-emerald-400">
                      Present
                    </th>
                    <th className="pb-3 font-semibold text-center text-rose-600 dark:text-rose-400">
                      Absent
                    </th>
                    <th className="pb-3 font-semibold text-center text-amber-600 dark:text-amber-400">
                      Late
                    </th>
                    <th className="pb-3 font-semibold text-right">Percentage</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {subjectBreakdown.map((sub) => {
                    const isBelow = sub.percentage !== null && sub.percentage < summary.threshold;
                    return (
                      <tr key={sub.subjectId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3">
                          <div className="font-medium text-foreground">{sub.code}</div>
                          <div className="text-xs text-muted-foreground">{sub.name}</div>
                        </td>
                        <td className="py-3 text-center font-mono text-xs">{sub.totalSessions}</td>
                        <td className="py-3 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400">
                          {sub.attendedSessions}
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-rose-600 dark:text-rose-400">
                          {sub.absentSessions}
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-amber-600 dark:text-amber-400">
                          {sub.lateSessions}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-semibold tabular-nums text-xs px-2 py-0.5 rounded ${
                              isBelow
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {sub.percentage !== null ? `${sub.percentage.toFixed(1)}%` : "N/A"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${
                              isBelow
                                ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5"
                                : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                            }`}
                          >
                            {isBelow ? "Low Attendance" : "Regular"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Logs Table */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Session Attendance Log ({records.length} Records)
          </CardTitle>
          <CardDescription className="text-xs">
            Chronological log of verified session attendance check-ins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No attendance sessions recorded for the selected date range.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-card border-b border-border/80">
                  <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Subject</th>
                    <th className="pb-2 font-semibold">Class Section</th>
                    <th className="pb-2 font-semibold">Time</th>
                    <th className="pb-2 font-semibold text-center">Status</th>
                    <th className="pb-2 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {records.map((rec) => {
                    const statusColors = {
                      PRESENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                      ABSENT: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                      LATE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      EXCUSED: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                    };

                    return (
                      <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 font-medium text-foreground">{rec.date}</td>
                        <td className="py-2.5">
                          <span className="font-semibold text-xs">{rec.subjectCode}</span>{" "}
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            ({rec.subjectName})
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {rec.className} ({rec.section})
                        </td>
                        <td className="py-2.5 font-mono text-xs text-muted-foreground">
                          {rec.startTime || "—"}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                              statusColors[rec.status]
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                          {rec.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
