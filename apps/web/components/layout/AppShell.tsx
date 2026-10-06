"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidthPage = pathname === "/" || pathname === "/login";

  if (isFullWidthPage) {
    return <main className="min-h-screen w-full bg-white">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex w-full">
      <Suspense fallback={<div className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 ml-64 flex flex-col min-h-screen min-w-0">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
