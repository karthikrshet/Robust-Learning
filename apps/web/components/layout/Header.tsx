"use client";

import Link from "next/link";
import { PlusCircle, FlaskConical, Database, ArrowRight } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {action ? (
          action
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/datasets?tab=upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Datasets</span>
            </Link>
            <Link
              href="/experiments/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Experiment</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
