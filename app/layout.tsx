import type { Metadata } from "next";

import "./globals.css";
import "./global.css";

import {
  LanguageProvider,
} from "@/lib/i18n/LanguageProvider";

export const metadata: Metadata = {
  title:
    "Padiata | Review Intelligence Lab",

  description:
    "Plataforma de inteligencia para el análisis y gestión de reviews hoteleras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}