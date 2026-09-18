import { LucideIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  features: string[];
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  badgeText = "Phase Planned",
  features,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
              <Badge variant="default">{badgeText}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Documentation
          </Button>
          <Button variant="primary" size="sm">
            Configure Module
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Architecture Readiness</CardTitle>
            <CardDescription>Foundation verified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">100%</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Scaffolded</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">Route mapped to application shell with type-safe layout.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Data Integration</CardTitle>
            <CardDescription>Database entity link</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">Prisma</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Upcoming</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">Ready for database schema integration in subsequent phase.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Role Access</CardTitle>
            <CardDescription>RBAC Permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">Admin</span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">Restricted</span>
            </div>
            <p className="text-xs text-slate-500 mt-3">Enforces strict server-side role validation when active.</p>
          </CardContent>
        </Card>
      </div>

      {/* Planned Capabilities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <CardTitle>Planned Capabilities for this Module</CardTitle>
          </div>
          <CardDescription>
            Core features defined in PROJECT_SPEC.md awaiting incremental phase implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
