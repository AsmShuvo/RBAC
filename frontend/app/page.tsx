"use client";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">
          RBAC Platform
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          Multi-role web platform with dynamic permissions
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  );
}
