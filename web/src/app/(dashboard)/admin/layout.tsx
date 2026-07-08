export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth and dashboard layout are already provided by parent (dashboard) layout.
  return <>{children}</>;
}
