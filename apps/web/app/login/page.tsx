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
  AlertCircle,
  KeyRound,
  Loader2
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth, User } from "@/lib/auth";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const reason = searchParams.get("reason");
  const { login, quickLogin } = useAuth();

  const [email, setEmail] = useState("alex.vance@academic-lab.edu");
  const [password, setPassword] = useState("researcher2026!");
  const [role, setRole] = useState<User["role"]>("Lead Researcher");
  const [name, setName] = useState("Dr. Alex Vance");
  const [institution, setInstitution] = useState("Machine Learning Robustness Laboratory");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password, role, name, institution);
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuick = async (preset: "researcher" | "evaluator" | "guide") => {
    setIsLoading(true);
    setError(null);
    try {
      if (preset === "guide") {
        await login(
          "chen.wei@stanford-ai.edu",
          "stanford2026!",
          "Professor",
          "Prof. Wei Chen",
          "Stanford AI Robustness Group"
        );
      } else {
        await quickLogin(preset);
      }
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || "Failed to authenticate preset session.");
    } finally {
      setIsLoading(false);
    }
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
          Sign in with validated credentials to access the laboratory, dataset catalog, and model pipelines.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl space-y-6">
          {reason === "auth_required" && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5 animate-in fade-in">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold block">Access Restricted</span>
                <span className="text-[11px] text-amber-700">
                  Authentication is required to enter the research laboratory. Please sign in below.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Evaluator Access Cards */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Click Verified Demonstration Sign-In
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuick("evaluator")}
                disabled={isLoading}
                className="p-2.5 text-left rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-400 transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-900">
                  <UserCheck className="w-3 h-3 text-blue-600" />
                  <span>Evaluator</span>
                </div>
                <span className="text-[9px] text-blue-700/90 block mt-0.5 truncate font-medium">
                  Prof. Bennett
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick("researcher")}
                disabled={isLoading}
                className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                  <KeyRound className="w-3 h-3 text-slate-600" />
                  <span>Scientist</span>
                </div>
                <span className="text-[9px] text-slate-500 block mt-0.5 truncate font-medium">
                  Dr. Vance
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuick("guide")}
                disabled={isLoading}
                className="p-2.5 text-left rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/60 hover:border-indigo-300 transition-all cursor-pointer group disabled:opacity-50"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-900">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span>Professor</span>
                </div>
                <span className="text-[9px] text-indigo-700 block mt-0.5 truncate font-medium">
                  Prof. Chen
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
                <span className="text-[10px] text-slate-400">Min 6 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Enter Laboratory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Security Features Notice */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Backend-Verified Session
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
