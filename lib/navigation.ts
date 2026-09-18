import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileBarChart,
  Settings,
  Bell,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Academic Management",
    items: [
      {
        title: "Students",
        href: "/students",
        icon: GraduationCap,
      },
      {
        title: "Teachers",
        href: "/teachers",
        icon: Users,
      },
      {
        title: "Classes",
        href: "/classes",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Attendance & Analytics",
    items: [
      {
        title: "Attendance",
        href: "/attendance",
        icon: ClipboardCheck,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
      {
        title: "Audit Logs",
        href: "/audit-logs",
        icon: ShieldCheck,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];
