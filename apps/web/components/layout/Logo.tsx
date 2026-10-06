import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = "md",
  showText = true,
  href = "/",
  className = "",
}: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: {
      title: "text-sm",
      sub: "text-[9px]",
    },
    md: {
      title: "text-base",
      sub: "text-[10px]",
    },
    lg: {
      title: "text-xl",
      sub: "text-xs",
    },
  };

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Neural Shield Emblem */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center shadow-sm shrink-0 relative overflow-hidden border border-blue-400/30`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          {/* Shield Outline */}
          <path
            d="M18 4L6 8.5V17C6 24.5 11.2 31.2 18 33C24.8 31.2 30 24.5 30 17V8.5L18 4Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-95"
          />
          {/* Internal Neural Graph & Data Nodes */}
          <circle cx="18" cy="13" r="2" fill="#93C5FD" />
          <circle cx="13" cy="22" r="2" fill="#BFDBFE" />
          <circle cx="23" cy="22" r="2" fill="#60A5FA" />
          {/* Graph edges */}
          <line
            x1="18"
            y1="13"
            x2="13"
            y2="22"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="2 1"
          />
          <line
            x1="18"
            y1="13"
            x2="23"
            y2="22"
            stroke="white"
            strokeWidth="1.5"
            strokeDasharray="2 1"
          />
          <line
            x1="13"
            y1="22"
            x2="23"
            y2="22"
            stroke="white"
            strokeWidth="1.5"
          />
          {/* Center Robust Pulse Node */}
          <circle cx="18" cy="18.5" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-black text-slate-900 tracking-tight leading-tight ${textSizes[size].title}`}
          >
            Robust<span className="text-blue-600">Learning</span>
          </span>
          <span
            className={`font-bold tracking-widest uppercase text-blue-700/80 ${textSizes[size].sub}`}
          >
            Academic Research Lab
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
