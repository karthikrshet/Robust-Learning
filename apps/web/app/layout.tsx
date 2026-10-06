import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Robust Learning Lab | Academic Classification Platform",
  description: "Robust Learning Under Label Noise for Real-World Classification Problems",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex">
        <Suspense fallback={<div className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <main className="flex-1 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}
