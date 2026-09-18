"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationConfig } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";
import { useSession } from "next-auth/react";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "STUDENT";

  // Filter navigation items by role
  const isItemVisible = (href: string): boolean => {
    const adminOnly = ["/settings", "/audit-logs", "/teachers"];

    if (adminOnly.includes(href)) {
      return userRole === "ADMIN";
    }
    return true;
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen w-64 border-r border-slate-200/80 bg-white select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <CheckCheck className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm tracking-tight">Smart Attendance</span>
          <span className="text-[11px] font-medium text-slate-400">Institutional Suite</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationConfig.map((section, idx) => {
          const visibleItems = section.items.filter((item) => isItemVisible(item.href));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 group",
                        isActive
                          ? "bg-indigo-50/80 text-indigo-700 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Institution Info Card */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-800">Academic Term</p>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Fall 2026 • Verified Role: {userRole}</p>
        </div>
      </div>
    </aside>
  );
}
