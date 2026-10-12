import "./admin.css";
// Authentication and private data must be evaluated for each request.
export const dynamic = "force-dynamic";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="admin-layout">{children}</div>; }
