import { UserRole } from "@/types/auth";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  Bell,
  Settings,
  BookOpen,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  SUPER_ADMIN: [
    { title: "SaaS Dashboard", href: "/admin/saas", icon: LayoutDashboard },
    { title: "Manage Schools", href: "/admin/saas/schools", icon: Building2 },
    { title: "Subscriptions", href: "/admin/saas/subscriptions", icon: CreditCard },
    { title: "Global Settings", href: "/admin/saas/settings", icon: Settings },
  ],
  INSTITUTION_ADMIN: [
    { title: "Dashboard", href: "/admin/school", icon: LayoutDashboard },
    { title: "Academic Setup", href: "/admin/school/academics", icon: BookOpen },
    { title: "Students", href: "/admin/school/students", icon: GraduationCap },
    { title: "Teachers & Staff", href: "/admin/school/staff", icon: Users },
    { title: "Attendance", href: "/admin/school/attendance", icon: CalendarCheck },
    { title: "Fees & Finance", href: "/admin/school/fees", icon: CreditCard },
    { title: "Exams & Results", href: "/admin/school/exams", icon: FileSpreadsheet },
    { title: "Notice Board", href: "/admin/school/notices", icon: Bell },
  ],
  TEACHER: [
    { title: "Teacher Dashboard", href: "/teacher", icon: LayoutDashboard },
    { title: "Mark Attendance", href: "/teacher/attendance", icon: CalendarCheck },
    { title: "Exam Gradebook", href: "/teacher/grades", icon: FileSpreadsheet },
    { title: "My Timetable", href: "/teacher/timetable", icon: BookOpen },
    { title: "School Notices", href: "/teacher/notices", icon: Bell },
  ],
  PARENT: [
    { title: "Parent Portal", href: "/parent", icon: LayoutDashboard },
    { title: "Child Attendance", href: "/parent/attendance", icon: CalendarCheck },
    { title: "Fee Vouchers", href: "/parent/fees", icon: CreditCard },
    { title: "Report Cards", href: "/parent/reports", icon: FileSpreadsheet },
    { title: "School Notices", href: "/parent/notices", icon: Bell },
  ],
  STUDENT: [
    { title: "Student Portal", href: "/student", icon: LayoutDashboard },
    { title: "My Attendance", href: "/student/attendance", icon: CalendarCheck },
    { title: "My Results", href: "/student/results", icon: FileSpreadsheet },
    { title: "Fee Status", href: "/student/fees", icon: CreditCard },
    { title: "Notices", href: "/student/notices", icon: Bell },
  ],
};
