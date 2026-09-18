import { AppShell } from "@/components/dashboard/app-shell";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        title="Notifications & Alerts"
        description="Low attendance triggers, daily class submission reminders, and system notifications."
        icon={Bell}
        badgeText="Communication"
        features={[
          "Automated debarment risk alerts triggered when student falls below threshold",
          "Daily reminders to faculty for pending class session attendance submissions",
          "Official institutional broadcasts to student batches or department faculty",
          "In-app notifications center with read/unread tracking",
          "Email notification dispatch channel integration (planned)"
        ]}
      />
    </AppShell>
  );
}
