import "./admin.css";
import "@/components/admin/orders.css";
import { cookies } from "next/headers";
import { AdminThemeProvider } from "@/components/admin/admin-theme";
// Authentication and private data must be evaluated for each request.
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get("rc2_admin_theme")?.value;
  return <AdminThemeProvider initialTheme={saved === "dark" ? "dark" : "light"}>{children}</AdminThemeProvider>;
}
