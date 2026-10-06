"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  name: string;
  email: string;
  role: "Lead Researcher" | "Evaluator / Reviewer" | "Graduate Student" | "Professor";
  institution: string;
  avatarSeed: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: User["role"], name?: string) => void;
  logout: () => void;
  quickLogin: (preset: "researcher" | "evaluator") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  quickLogin: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage
    const saved = localStorage.getItem("robust_learning_auth_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {}
    } else {
      // Default to guest or auto-login as Lead Researcher for evaluation
      const defaultUser: User = {
        name: "Dr. Alex Vance",
        email: "alex.vance@academic-lab.edu",
        role: "Lead Researcher",
        institution: "Machine Learning Robustness Laboratory",
        avatarSeed: "AV",
      };
      setUser(defaultUser);
      localStorage.setItem("robust_learning_auth_user", JSON.stringify(defaultUser));
    }
  }, []);

  const login = (
    email: string,
    role: User["role"] = "Lead Researcher",
    name = "ML Researcher"
  ) => {
    const newUser: User = {
      name,
      email,
      role,
      institution: "Robust Learning Laboratory",
      avatarSeed: name.substring(0, 2).toUpperCase(),
    };
    setUser(newUser);
    localStorage.setItem("robust_learning_auth_user", JSON.stringify(newUser));
  };

  const quickLogin = (preset: "researcher" | "evaluator") => {
    if (preset === "evaluator") {
      login(
        "evaluator@review-board.org",
        "Evaluator / Reviewer",
        "Prof. Eleanor Bennett"
      );
    } else {
      login(
        "alex.vance@academic-lab.edu",
        "Lead Researcher",
        "Dr. Alex Vance"
      );
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("robust_learning_auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
