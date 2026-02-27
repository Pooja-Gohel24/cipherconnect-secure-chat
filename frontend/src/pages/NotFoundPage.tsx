import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <Link to="/" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
          Go home
        </Link>
      </div>
    </div>
  );
}
