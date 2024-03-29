// src/app/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }) {
  return (
    <SessionProvider basePath="/dashboards/api/auth" refetchInterval={4 * 60}>
      {children}
    </SessionProvider>
  );
}
