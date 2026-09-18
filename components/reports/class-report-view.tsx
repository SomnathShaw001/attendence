"use client";

import React from "react";
import { ClassReportItem } from "@/app/reports/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Users, Calendar } from "lucide-react";

interface ClassReportViewProps {
  data: ClassReportItem;
}

export function ClassReportView({ data }: ClassReportViewProps) {
  const { classInfo, summary, students, sessions } = data;

  return (
    <div className="space-y-6">
      {/* Class Information Banner */}
      <Card className="border-border/70 shadow-sm bg-gradient-to-r from-muted/40 via-background to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/20">
                <School className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{classInfo.name}</h2>
                  <Badge variant="outline" className="text-xs">
                    Section {classInfo.section}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Subject: <span className="font-semibold text-foreground">{classInfo.subjectCode}</span> ({classInfo.subjectName}) &bull; Instructor: {classInfo.teacherName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Class Average:</span>
              <span
                className={`text-2xl font-bold ${
                  summary.overallPercentage !== null && summary.overallPercentage >= summary.threshold
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {summary.overallPercentage !== null ? `${summary.overallPercentage.toFixed(1)}%` : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Sessions Conducted</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.totalSessions}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Enrolled Students</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.enrolledStudentsCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-muted-foreground">Entries Audited</span>
            <p className="text-2xl font-bold mt-1 text-foreground">{summary.totalRecords}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Below 75% Target</span>
            <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {summary.studentsBelowThresholdCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Students Attendance Table */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Enrolled Student Attendance Roster ({students.length} Students)
          </CardTitle>
          <CardDescription className="text-xs">
            Individual attendance tallies and threshold compliance for this class section
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No students enrolled in this class section.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Roll No</th>
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold text-center">Attended</th>
                    <th className="pb-3 font-semibold text-center">Absent</th>
                    <th className="pb-3 font-semibold text-center">Late</th>
                    <th className="pb-3 font-semibold text-center">Total</th>
                    <th className="pb-3 font-semibold text-right">Percentage</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {students.map((st) => {
                    const isBelow = st.isBelowThreshold;
                    return (
                      <tr key={st.studentId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-mono text-xs font-medium text-foreground">
                          {st.rollNo}
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-foreground">{st.name}</div>
                          <div className="text-xs text-muted-foreground">{st.email}</div>
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          {st.attendedSessions}
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-rose-600 dark:text-rose-400">
                          {st.absentSessions}
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-amber-600 dark:text-amber-400">
                          {st.lateSessions}
                        </td>
                        <td className="py-3 text-center font-mono text-xs text-muted-foreground">
                          {st.totalSessions}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`font-semibold tabular-nums text-xs px-2 py-0.5 rounded ${
                              isBelow
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {st.percentage !== null ? `${st.percentage.toFixed(1)}%` : "N/A"}
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
                            {isBelow ? "Low Attendance" : "Good Standing"}
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

      {/* Sessions Conducted Breakdown */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Class Lecture Sessions ({sessions.length} Held)
          </CardTitle>
          <CardDescription className="text-xs">
            Per-session lecture delivery and attendance turnout
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No completed sessions recorded for this class in selected date range.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-card border-b border-border/80">
                  <tr className="text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Timing</th>
                    <th className="pb-2 font-semibold">Instructor</th>
                    <th className="pb-2 font-semibold text-center text-emerald-600 dark:text-emerald-400">Present</th>
                    <th className="pb-2 font-semibold text-center text-rose-600 dark:text-rose-400">Absent</th>
                    <th className="pb-2 font-semibold text-center text-amber-600 dark:text-amber-400">Late</th>
                    <th className="pb-2 font-semibold text-right">Turnout Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium text-foreground">{sess.date}</td>
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {sess.startTime || "Regular"}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">{sess.teacherName}</td>
                      <td className="py-2.5 text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {sess.presentCount}
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs text-rose-600 dark:text-rose-400 font-medium">
                        {sess.absentCount}
                      </td>
                      <td className="py-2.5 text-center font-mono text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {sess.lateCount}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-xs tabular-nums">
                        {sess.percentage !== null ? `${sess.percentage.toFixed(1)}%` : "N/A"}
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
  );
}
