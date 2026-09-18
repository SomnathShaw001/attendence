import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";
import { QrScannerView } from "@/components/attendance/qr-scanner-view";
import { AttendanceNavTabs } from "@/components/attendance/attendance-nav-tabs";

export const metadata = {
  title: "Scan QR Attendance - Smart Attendance System",
  description: "Check in to live classroom attendance session via rotating dynamic QR code.",
};

export default async function QrScanPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <AttendanceNavTabs userRole={session.user.role} />
        <QrScannerView />
      </div>
    </AppShell>
  );
}
