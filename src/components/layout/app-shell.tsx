import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Map,
  FilePenLine,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import appLogo from "@/assets/super_unemployed.webp";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/app/jobs",
    label: "Job Management",
    icon: BriefcaseBusiness,
    children: [
      { href: "/app/jobs", label: "Job Listings", icon: BriefcaseBusiness },
      { href: "/app/tracker", label: "Job Tracker", icon: KanbanSquare },
      { href: "/app/interviews", label: "Interviews", icon: UserCheck },
    ],
  },
  { href: "/app/roadmaps", label: "Roadmaps", icon: Map },
  {
    href: "/app/documents/resume",
    label: "Document Management",
    icon: FilePenLine,
    children: [
      { href: "/app/documents/resume", label: "Resume", icon: FilePenLine },
      { href: "/app/documents/cover-letter", label: "Cover Letter", icon: FileText },
    ],
  },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "/app/jobs": true,
    "/app/documents/resume": true,
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <div
        role="banner"
        className="sticky top-0 z-40 border-b border-slate-300 bg-white text-slate-900 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-100"
      >
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <img src={appLogo} alt="Super Unemployed logo" className="h-7 w-7 rounded-sm object-cover" />
            <span>Super Unemployed</span>
          </h1>
          <Button
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
      <div className="flex min-h-[calc(100vh-57px)]">
        {sidebarOpen ? (
          <button
            className="fixed inset-0 z-20 bg-black/70 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-[57px] z-30 overflow-y-auto border-r border-slate-300 bg-white text-slate-900 transition-transform dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 md:sticky md:top-[57px] md:h-[calc(100vh-57px)] md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "md:w-16" : "md:w-64",
            "w-72",
          )}
        >
          <div className="p-2 md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="space-y-1 p-2">
            {navItems.map(({ href, label, icon: Icon, children }) => {
              const parentActive = location.pathname === href || location.pathname.startsWith(`${href}/`) || children?.some((child) => location.pathname === child.href);
              return (
                <div key={href} className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center rounded-md text-sm text-slate-300 hover:bg-slate-900",
                      parentActive && "bg-slate-900 text-cyan-300",
                    )}
                  >
                    {children?.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [href]: !prev[href],
                          }))
                        }
                        className={cn(
                          "flex w-full items-center px-3 py-2",
                          sidebarCollapsed ? "justify-center" : "justify-between gap-2",
                        )}
                        title={sidebarCollapsed ? label : undefined}
                        aria-label={`Toggle ${label} submenu`}
                      >
                        <span className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "gap-2")}>
                          <Icon className="h-4 w-4" />
                          {!sidebarCollapsed ? label : null}
                        </span>
                        {!sidebarCollapsed ? expandedGroups[href] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> : null}
                      </button>
                    ) : null}
                    {!children?.length ? (
                      <Link
                        to={href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex flex-1 items-center rounded-md px-3 py-2",
                          sidebarCollapsed ? "justify-center gap-0" : "gap-2",
                        )}
                        title={sidebarCollapsed ? label : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        {!sidebarCollapsed ? label : null}
                      </Link>
                    ) : null}
                  </div>
                  {children?.length && !sidebarCollapsed ? (
                    <div className={cn("space-y-1", sidebarCollapsed ? "" : "ml-6", !sidebarCollapsed && !expandedGroups[href] && "hidden")}>
                      {children.map(({ href: childHref, label: childLabel, icon: ChildIcon }) => {
                        const childActive = location.pathname === childHref || location.pathname.startsWith(`${childHref}/`);
                        return (
                          <Link
                            key={childHref}
                            to={childHref}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-slate-900",
                              sidebarCollapsed ? "justify-center gap-0" : "gap-2",
                              childActive && "bg-slate-900 text-cyan-300",
                            )}
                            title={sidebarCollapsed ? childLabel : undefined}
                          >
                            <ChildIcon className="h-4 w-4" />
                            {!sidebarCollapsed ? childLabel : null}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
