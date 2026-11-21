import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "SuperBrain - Your Second Brain",
  description: "Store, search, and share your knowledge with AI-powered semantic search",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>
          <div className="flex min-h-screen bg-background text-foreground">
            <Suspense fallback={<div className="w-72 h-screen border-r-4 border-border bg-background hidden lg:block" />}>
              <Sidebar />
            </Suspense>
            <div className="flex-1 flex flex-col">
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
