"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, Search, User as UserIcon, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

interface AppHeaderProps {
  onOpenMobileNav: () => void;
}

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const getPageTitle = (path: string): string => {
    if (path === "/" || path === "/dashboard") return "Overview Dashboard";
    const segment = path.split("/")[1] || "Dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ");
  };

  const role = session?.user?.role || "STUDENT";
  const roleBadgeVariant =
    role === "ADMIN" ? "default" : role === "TEACHER" ? "warning" : "success";

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xs sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
            {getPageTitle(pathname)}
          </h1>
          <Badge variant={roleBadgeVariant} className="uppercase font-semibold text-[10px]">
            {role}
          </Badge>
        </div>
      </div>

      {/* Right: Search, Notifications & User Session */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span>Quick search...</span>
          <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono text-slate-500">
            ⌘K
          </kbd>
        </div>

        {/* Notifications Icon Button */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        {/* User Pill with Live Session */}
        <div className="flex items-center gap-2.5 pl-1">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="h-8 w-8 rounded-xl object-cover border border-slate-200"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-xs shadow-2xs">
              {session?.user?.name ? (
                session.user.name.slice(0, 2).toUpperCase()
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </div>
          )}

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight">
              {session?.user?.name || "Academic User"}
            </span>
            <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[140px]">
              {session?.user?.email || "Signed in"}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
