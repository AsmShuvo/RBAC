"use client";

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="text-9xl font-bold text-transparent bg-gradient-to-r from-red-400 to-red-600 bg-clip-text mb-4">
          403
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-xl text-slate-300 mb-8">You don't have permission to access this resource.</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
