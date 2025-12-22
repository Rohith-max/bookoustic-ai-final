// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getAllFontsUrl } from "@/lib/book-fonts";
// Removed TooltipProvider since tooltip UI is no longer used
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bookoustic - AI Book Author",
  description: "Generate professional books with AI",
  generator: "Bookoustic",
  icons: {
    icon: '/bookicon.ico',
    shortcut: '/bookicon.ico',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.webmanifest',
};

// Safe ClerkProvider component
const SafeClerkProvider = ({ children }: { children: ReactNode }) => {
  try {
    return (
      <ClerkProvider>
        {children}
      </ClerkProvider>
    );
  } catch (error) {
    console.error("Error initializing ClerkProvider:", error);
    return <>{children}</>;
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SafeClerkProvider>
      <html lang="en" suppressHydrationWarning className="h-full">
        <head>
          <link rel="icon" href="/bookicon.ico" type="image/x-icon" />
          <link rel="shortcut icon" href="/bookicon.ico" type="image/x-icon" />
          <link rel="stylesheet" href={getAllFontsUrl()} />
        </head>
        <body className="h-full">
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
            <Toaster />
            <Sonner />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </SafeClerkProvider>
  );
}