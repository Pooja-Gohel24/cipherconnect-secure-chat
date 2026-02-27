import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome to CipherConnect</h1>
      <p className="mt-3 text-slate-700">Logged in as: {user?.email || "-"}</p>
      <p className="mt-1 text-slate-700">Role: {user?.role || "user"}</p>
    </div>
  );
}
