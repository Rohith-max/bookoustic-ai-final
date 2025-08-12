// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getAllFontsUrl } from "@/lib/book-fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bookoustic - AI Book Author",
  description: "Generate professional books with AI",
  generator: "Bookoustic",
  icons: {
    icon: '/favicon.ico',
  },
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
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="stylesheet" href={getAllFontsUrl()} />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="shortcut icon" href="/favicon.ico" />
        </head>
        <body>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </SafeClerkProvider>
  );
}