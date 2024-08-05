// src/components/SessionGuard.tsx
"use client";
import { signIn, useSession } from "next-auth/react";
import { ReactNode, useEffect } from "react";

export default function SessionGuard({ children }: { children: ReactNode[] }) {
  const { data } = useSession();
  useEffect(() => {
    // @ts-ignore
    if (data?.error === "RefreshAccessTokenError") {
      signIn("keycloak").then((r) => {});
    }
  }, [data]);

  return <>{children}</>;
}
