"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }) {
  return (
    <SessionProvider basePath={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/auth`} refetchInterval={4 * 60}>
      {children}
    </SessionProvider>
  );
}
