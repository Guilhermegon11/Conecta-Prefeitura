import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minas Opina | Pesquisa eleitoral 2026",
  description: "Pesquisa independente para eleitores de Minas Gerais. Participe por convite e acompanhe os resultados publicados.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
