import type { Metadata } from "next";
import { AnnouncementBar } from "@/components/announcement-bar";
import { getAnnouncementText } from "@/lib/storefront";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Notta Decants", template: "%s · Notta Decants" },
  description: "Perfumes, decants y frascos completos para descubrir tu próxima fragancia.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const announcement = await getAnnouncementText();

  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AnnouncementBar text={announcement} />{children}</body>
    </html>
  );
}
