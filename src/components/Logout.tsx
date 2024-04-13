"use client";

export default function Logout() {
  return (
    <button
      className="mt-8"
      onClick={() => (window.location.href = "/api/auth/federated-logout")}
    >
      Se déconnecter
    </button>
  );
}
