"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationConfig } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { X, CheckCheck } from "lucide-react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "STUDENT";

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isOpen) return null;

  const isItemVisible = (href: string): boolean => {
    const adminOnly = ["/settings", "/audit-logs", "/teachers"];
    const staffOnly = ["/reports"];

    if (adminOnly.includes(href)) {
      return userRole === "ADMIN";
    }
    if (staffOnly.includes(href)) {
      return userRole === "ADMIN" || userRole === "TEACHER";
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <CheckCheck className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">Smart Attendance</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Links */}
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
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-indigo-600" : "text-slate-400"
                          )}
                        />
                        <span>{item.title}</span>
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
      </div>
    </div>
  );
}
