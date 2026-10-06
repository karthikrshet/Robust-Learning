"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  FlaskConical,
  LineChart,
  BookOpen,
  Upload,
  PlusCircle,
  ShieldCheck,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function Sidebar() {
  const pathname = usePathname();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    api.checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      title: "Datasets",
      href: "/datasets",
      icon: Database,
      active: pathname.startsWith("/datasets"),
      subItems: [
        { title: "All Datasets", href: "/datasets" },
        { title: "Upload / Load", href: "/datasets?tab=upload" },
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
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
                Robust Learning
              </span>
              <span className="text-[11px] text-blue-600 font-semibold tracking-wider uppercase">
                Academic Lab
              </span>
            </div>
          </Link>
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

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between">
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
            <span className="text-xs text-slate-600 font-medium">
              {isBackendHealthy === true
                ? "API Active"
                : isBackendHealthy === false
                ? "API Disconnected"
                : "Connecting..."}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
