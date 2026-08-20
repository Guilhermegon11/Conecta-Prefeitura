import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegistrar } from "./platform-experience";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prefeitura Conecta IA",
  description: "Gestão municipal inteligente, integrada e próxima do cidadão.",
  other: { "codex-preview": "development" },
  manifest: "/manifest.webmanifest",
  applicationName: "Prefeitura Conecta IA",
  openGraph: {
    title: "Prefeitura Conecta IA",
    description: "Gestão municipal inteligente, integrada e próxima do cidadão.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Prefeitura Conecta IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prefeitura Conecta IA",
    description: "Gestão municipal inteligente, integrada e próxima do cidadão.",
    images: ["/og.png"],
  },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
