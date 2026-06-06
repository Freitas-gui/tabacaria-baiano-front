import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/cart-context";
import { UserProvider } from "@/contexts/user-context";
import { CDN_ORIGIN } from "@/lib/cdn";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tabacaria do Baiano",
  description: "Marketplace de artigos para tabacaria",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href={CDN_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={CDN_ORIGIN} />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
