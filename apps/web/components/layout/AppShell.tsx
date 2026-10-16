"use client";

import React, { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/layout/Logo";

const PUBLIC_ROUTES = ["/", "/login", "/methodology"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isFullWidthPage = pathname === "/" || pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname, router]);

  // Loading state while checking authentication
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Logo size="lg" />
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Verifying researcher authentication session...</span>
        </div>
      </div>
    );
  }

  // Access Denied / Auth Barrier if trying to access protected route without login
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The research laboratory, dataset catalog, and model training pipelines are restricted to authenticated ML engineers, evaluators, and researchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <span>Sign In to Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all"
          >
            Return to Public Overview
          </Link>
        </div>
      </div>
    );
  }

  // Full-width landing or login page
  if (isFullWidthPage) {
    return <main className="min-h-screen w-full bg-white">{children}</main>;
  }

  // Protected Laboratory with Sidebar
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
