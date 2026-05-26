import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TorcidaClub® | Gestão Completa para Torcidas Organizadas",
  description: "Plataforma SaaS para gestão de torcidas organizadas. Controle de sócios, pagamentos, eventos e ingressos.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "TorcidaClub® | Gestão Completa para Torcidas Organizadas",
    description: "Plataforma SaaS para gestão de torcidas organizadas. Controle de sócios, pagamentos, eventos e ingressos.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 628,
        alt: "TorcidaClub Logo",
      }
    ],
    type: "website",
  },
};

// Forçar renderização dinâmica para evitar erros de useSearchParams no build
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
