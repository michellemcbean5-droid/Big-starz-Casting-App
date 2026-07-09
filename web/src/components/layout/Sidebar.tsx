"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  User,
  Settings,
  Briefcase,
  FileText,
  DollarSign,
  Sparkles,
  Users,
  Key,
  FileSignature,
  ClipboardList,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const allNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Studio", href: "/studio", icon: Sparkles },
  { label: "Casting Calls", href: "/casting-calls", icon: Briefcase, roles: ["talent"] },
  { label: "My Applications", href: "/applications", icon: FileText, roles: ["talent"] },
  { label: "Earnings", href: "/earnings", icon: DollarSign, roles: ["talent", "creator"] },
  { label: "Post Casting", href: "/casting-calls", icon: Briefcase, roles: ["casting_director"] },
  { label: "My Listings", href: "/applications", icon: FileText, roles: ["casting_director"] },
  { label: "Applicants", href: "/applications", icon: Users, roles: ["casting_director"] },
  { label: "Content Library", href: "/studio", icon: Sparkles, roles: ["creator"] },
  { label: "Analytics", href: "/earnings", icon: DollarSign, roles: ["creator"] },
];

const adminNavItems: NavItem[] = [
  { label: "Admin Dashboard", href: "/admin", icon: ShieldAlert },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Master Codes", href: "/admin/codes", icon: Key },
  { label: "Contracts", href: "/admin/contracts", icon: FileSignature },
  { label: "Audit Logs", href: "/admin/audit", icon: ClipboardList },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "talent";
  const isAdmin = role === "admin";

  const navItems = allNavItems.filter(
    (item) => !item.roles || item.roles.includes(role) || isAdmin
  );

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border w-64">
      <div className="p-6">
        <Link href="/" onClick={onClose}>
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-border">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </p>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-gold"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </div>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">
            <Sidebar onClose={() => setOpen(false)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-[-40px] text-white"
              onClick={() => setOpen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
