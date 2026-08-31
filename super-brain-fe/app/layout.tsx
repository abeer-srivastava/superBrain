import type { Metadata } from "next";
import { Space_Grotesk, Archivo_Black } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

import { Suspense } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
});

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
      <body
        className={`${spaceGrotesk.variable} ${archivoBlack.variable} antialiased bg-retro-grid-faint`}
      >
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen text-foreground">
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
        </ThemeProvider>
      </body>
    </html>
  );
}
