"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function ClerkProviderWithOptions({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: 
            "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
          footerActionLink: "text-blue-600 hover:text-blue-700",
          card: "shadow-md rounded-lg border border-gray-200",
          headerTitle: "text-gray-900 text-xl",
          headerSubtitle: "text-gray-500",
          socialButtonsBlockButton: 
            "border border-gray-300 shadow-sm hover:bg-gray-50",
          formFieldInput: 
            "rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50",
          formFieldLabel: "text-gray-700"
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
} 