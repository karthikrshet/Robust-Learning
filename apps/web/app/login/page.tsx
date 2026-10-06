"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building,
  KeyRound
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth, User } from "@/lib/auth";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { login, quickLogin, user } = useAuth();

  const [email, setEmail] = useState("alex.vance@academic-lab.edu");
  const [password, setPassword] = useState("••••••••••••");
  const [role, setRole] = useState<User["role"]>("Lead Researcher");
  const [name, setName] = useState("Dr. Alex Vance");
  const [institution, setInstitution] = useState("Machine Learning Robustness Laboratory");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, role, name);
      router.push(redirect);
    }, 400);
  };

  const handleQuick = (preset: "researcher" | "evaluator") => {
    setIsLoading(true);
    setTimeout(() => {
      quickLogin(preset);
      router.push(redirect);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 to-transparent pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <Logo size="lg" href="/" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Researcher & Evaluator Portal
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Sign in to access the supervised label noise analysis laboratory and training platform.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl space-y-6">
          {/* Quick Evaluator Access Cards */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Click Fast Demonstration Sign-In
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuick("evaluator")}
                disabled={isLoading}
                className="p-3 text-left rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-400 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Evaluator</span>
                </div>
                <span className="text-[10px] text-blue-700/80 block mt-0.5">
                  Review & viva defense
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick("researcher")}
                disabled={isLoading}
                className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                  <span>Lead Scientist</span>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Full experiment access
                </span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or Custom Credentials</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Institutional Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Academic Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as User["role"])}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Lead Researcher">Lead Researcher</option>
                <option value="Evaluator / Reviewer">Evaluator / Reviewer</option>
                <option value="Professor">Professor / Project Guide</option>
                <option value="Graduate Student">Graduate Student</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Access Key / Password</label>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Default Demo Key</span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? "Authenticating Session..." : "Enter Research Laboratory"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Security Features Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Session Encrypted
            </span>
            <span>•</span>
            <span>Zero Data Leakage Protocol</span>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 font-semibold">
            ← Back to Public Research Overview
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Portal...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
