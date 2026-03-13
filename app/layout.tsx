import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copa Omega Star | Torneo Beyblade X",
  description: "Torneo oficial de Beyblade X. Registrate, competí y llevate todas las estrellas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-omega-black antialiased">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--color-omega-card)",
              border: "1px solid var(--color-omega-border)",
              color: "var(--color-omega-text)",
            },
          }}
        />
      </body>
    </html>
  );
}
