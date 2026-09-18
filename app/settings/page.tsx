import { AppShell } from "@/components/dashboard/app-shell";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <ModulePlaceholder
        title="System Settings & Institutional Policies"
        description="Attendance policy thresholds, semester calendars, role privileges, and system preferences."
        icon={Settings}
        badgeText="Administration"
        features={[
          "Configurable attendance thresholds (e.g. 75% minimum debarment limit)",
          "Academic term and semester start/end calendar definitions",
          "Working day configuration, holiday calendars, and lecture duration defaults",
          "Role-based access control (RBAC) privilege overrides",
          "Audit retention rules and institution profile details"
        ]}
      />
    </AppShell>
  );
}
