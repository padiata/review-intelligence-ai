import type { Metadata } from "next";
import "./globals.css";
import "./global.css";

export const metadata: Metadata = {
  title: "Review Intelligence Lab",
  description: "Asistente hotelero para responder y gestionar reviews",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
