import type { Metadata } from "next";
import "./globals.css";
import { PwaRegistrar } from "./platform-experience";

export const metadata: Metadata = {
  title: "Prefeitura Conecta",
  description: "Gestão municipal clara, integrada e inteligente.",
  manifest: "/manifest.webmanifest",
  applicationName: "Prefeitura Conecta",
  openGraph: {
    title: "Prefeitura Conecta",
    description: "Gestão municipal clara, integrada e inteligente.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Prefeitura Conecta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prefeitura Conecta",
    description: "Gestão municipal clara, integrada e inteligente.",
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
      <body>
        <a className="skip-link" href="#main-content">Pular para o conteúdo principal</a>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
