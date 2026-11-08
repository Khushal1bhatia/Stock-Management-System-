import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { IconSprite } from "@/components/icons";
import "@/styles/app.css";
import "@/styles/views.css";
import "@/styles/login.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Stock Management System",
    template: "%s · Stock Management System"
  },
  description: "Inventory, movements, and supplier control for ASO Users.",
  applicationName: "Stock Management System",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#123B2E"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
