import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Page Not Found</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested page could not be located. It may have been moved or removed.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
