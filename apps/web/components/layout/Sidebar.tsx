"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  FlaskConical,
  LineChart,
  BookOpen,
  LogOut,
  User,
  ShieldCheck,
  Home
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    api.checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const navItems = [
    {
      title: "Landing Overview",
      href: "/",
      icon: Home,
      active: pathname === "/",
    },
    {
      title: "Lab Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      title: "Datasets",
      href: "/datasets",
      icon: Database,
      active: pathname.startsWith("/datasets"),
      subItems: [
        { title: "All Datasets", href: "/datasets" },
        { title: "Upload / Load", href: "/datasets" },
      ],
    },
    {
      title: "Experiments",
      href: "/experiments",
      icon: FlaskConical,
      active: pathname.startsWith("/experiments"),
      subItems: [
        { title: "All Experiments", href: "/experiments" },
        { title: "New Experiment", href: "/experiments/new" },
      ],
    },
    {
      title: "Analysis",
      href: "/analysis",
      icon: LineChart,
      active: pathname.startsWith("/analysis"),
    },
    {
      title: "Methodology",
      href: "/methodology",
      icon: BookOpen,
      active: pathname === "/methodology",
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 select-none">
      <div>
        {/* Brand Header with Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Logo size="md" href="/" />
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="space-y-1">
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.active ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.title}</span>
                  </div>
                </Link>

                {item.subItems && item.active && (
                  <div className="ml-7 pl-2 border-l border-slate-200 space-y-1 py-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className={`block px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          pathname === sub.href
                            ? "text-blue-600 font-semibold bg-blue-50/50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        {sub.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Session & Status Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user.avatarSeed}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-blue-700 font-medium block truncate">
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign out of session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center block transition-colors"
          >
            Researcher Sign In
          </Link>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy === true
                  ? "bg-emerald-500 ring-4 ring-emerald-100"
                  : isBackendHealthy === false
                  ? "bg-rose-500 ring-4 ring-rose-100"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] text-slate-600 font-medium">
              {isBackendHealthy === true
                ? "API Connected"
                : isBackendHealthy === false
                ? "API Offline"
                : "Connecting..."}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
