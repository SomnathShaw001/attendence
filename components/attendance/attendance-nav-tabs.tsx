"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, History, QrCode } from "lucide-react";

interface AttendanceNavTabsProps {
  userRole: string;
}

export function AttendanceNavTabs({ userRole }: AttendanceNavTabsProps) {
  const pathname = usePathname();
  const isTakeAttendance = pathname === "/attendance";
  const isHistory = pathname.startsWith("/attendance/history");
  const isQrScan = pathname.startsWith("/attendance/qr/scan");

  const canTakeAttendance = userRole === "ADMIN" || userRole === "TEACHER";

  return (
    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px mb-6 overflow-x-auto">
      {canTakeAttendance && (
        <Link
          href="/attendance"
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            isTakeAttendance
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Take Attendance</span>
        </Link>
      )}

      {/* QR Scanner tab for students (and staff testing) */}
      <Link
        href="/attendance/qr/scan"
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
          isQrScan
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
      >
        <QrCode className="w-4 h-4" />
        <span>Scan QR Code</span>
      </Link>

      <Link
        href="/attendance/history"
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
          isHistory
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
      >
        <History className="w-4 h-4" />
        <span>Attendance History</span>
      </Link>
    </div>
  );
}
