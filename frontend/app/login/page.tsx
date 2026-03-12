"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        return;
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-6">
      <div className="w-full max-w-[440px] p-10 bg-white rounded-[40px] shadow-[0px_20px_50px_rgba(0,0,0,0.04)] border border-gray-100/50">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Login</h1>
          <p className="text-slate-400 text-sm">Enter your details to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl text-xs text-center border border-red-100">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF6B3D]/10 focus:border-[#FF6B3D] outline-none transition-all placeholder:text-slate-300 text-slate-600"
              placeholder="example@email.com"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 ml-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF6B3D]/10 focus:border-[#FF6B3D] outline-none transition-all placeholder:text-slate-300 text-slate-600"
                placeholder="Enter your password"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
            </div>
          </div>

          {/* Remember & Forgot Row */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-[#FF6B3D] focus:ring-[#FF6B3D] accent-[#FF6B3D]" 
              />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm text-[#FF6B3D] font-medium hover:opacity-80 transition-opacity">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#FF6B3D] text-white font-semibold rounded-2xl hover:bg-[#ff5a24] transition-all shadow-[0px_12px_24px_rgba(255,107,61,0.25)] disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-10">
          Don't have an account?{" "}
          <Link href="/register" className="text-slate-900 hover:underline font-semibold ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}