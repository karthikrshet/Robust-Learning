"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Lead Researcher" | "Evaluator / Reviewer" | "Graduate Student" | "Professor";
  institution: string;
  avatarSeed: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    role?: User["role"],
    name?: string,
    institution?: string
  ) => Promise<void>;
  logout: () => void;
  quickLogin: (preset: "researcher" | "evaluator") => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  quickLogin: async () => {},
});

export function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `rl_session_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "rl_session_token=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safely restore persisted session on client mount
    try {
      const savedUser = localStorage.getItem("robust_learning_auth_user");
      const savedToken = localStorage.getItem("robust_learning_auth_token");
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email && parsed.token) {
          setUser(parsed);
          setAuthCookie(parsed.token);
        } else {
          clearAuthCookie();
        }
      } else {
        clearAuthCookie();
      }
    } catch (_) {
      localStorage.removeItem("robust_learning_auth_user");
      localStorage.removeItem("robust_learning_auth_token");
      clearAuthCookie();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    role: User["role"] = "Lead Researcher",
    name?: string,
    institution?: string
  ) => {
    // Real validation
    if (!email || !email.includes("@")) {
      throw new Error("A valid academic or institutional email address is required.");
    }
    if (!password || password.trim().length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    // Call backend auth API
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
        role,
        name: name || undefined,
        institution: institution || undefined,
      }),
    });

    if (!res.ok) {
      let msg = "Authentication failed.";
      try {
        const err = await res.json();
        if (err.detail) msg = err.detail;
      } catch (_) {}
      throw new Error(msg);
    }

    const data = await res.json();
    const authenticatedUser: User = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      institution: data.institution,
      avatarSeed: data.avatar_seed || "RL",
      token: data.token,
    };

    setUser(authenticatedUser);
    setAuthCookie(authenticatedUser.token);
    localStorage.setItem("robust_learning_auth_user", JSON.stringify(authenticatedUser));
    localStorage.setItem("robust_learning_auth_token", authenticatedUser.token);
  };

  const quickLogin = async (preset: "researcher" | "evaluator") => {
    if (preset === "evaluator") {
      await login(
        "eleanor.bennett@academic-evaluators.org",
        "evaluator2026!",
        "Evaluator / Reviewer",
        "Prof. Eleanor Bennett",
        "Department of Computer Science Review Board"
      );
    } else {
      await login(
        "alex.vance@academic-lab.edu",
        "researcher2026!",
        "Lead Researcher",
        "Dr. Alex Vance",
        "Machine Learning Robustness Laboratory"
      );
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthCookie();
    localStorage.removeItem("robust_learning_auth_user");
    localStorage.removeItem("robust_learning_auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
