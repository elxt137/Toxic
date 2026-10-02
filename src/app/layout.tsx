import type { Metadata } from "next";
import { Bebas_Neue, Quicksand } from "next/font/google";
import { AnnouncementBar } from "@/components/announcement-bar";
import { getAnnouncementText } from "@/lib/storefront";
import "./globals.css";

const bodyFont = Quicksand({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: "Toxic", template: "%s · Toxic" },
  description: "Productos para el cuidado vehicular: shampoo, ceras, cepillos, luces LED y microfibras.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const announcement = await getAnnouncementText();

  return (
    <html lang="es" className={`h-full antialiased ${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-full flex flex-col"><AnnouncementBar text={announcement} />{children}</body>
    </html>
  );
}
