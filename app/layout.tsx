import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/cart-context";
import { UserProvider } from "@/contexts/user-context";
import { AgeGate } from "@/components/age-gate";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tabacaria do Baiano",
  description: "Marketplace de artigos para tabacaria",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <UserProvider>
          <CartProvider>
            <AgeGate>{children}</AgeGate>
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
