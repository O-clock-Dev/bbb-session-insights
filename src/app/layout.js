import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./Providers";
import SessionGuard from "@/components/SessionGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Dashboard-listing",
  description: "Liste des liens dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <SessionGuard>{children}</SessionGuard>
        </Providers>
      </body>
    </html>
  );
}
