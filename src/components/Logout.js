"use client"

import { signOut } from "next-auth/react";
import federatedLogout from "@/utils/federatedLogout";

export default function Logout() {
  return <button className="mt-8" onClick={() => federatedLogout()}>
    Se déconnecter
  </button>
}