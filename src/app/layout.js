import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./Providers";
import SessionGuard from "@/components/SessionGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sessions BigBlueButton",
  description: "Tableaux de bord d'activité des apprenants et replays des sessions BigBlueButton",
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
