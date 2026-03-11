"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useAuth } from "@/app/context/auth";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    permissions: 0,
    auditLogs: 0,
    activeUsers: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const [usersRes, permRes, auditRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersRes.json();
      const permData = await permRes.json();
      const auditData = await auditRes.json();

      setStats({
        users: usersData.length || 0,
        permissions: permData.length || 0,
        auditLogs: auditData.total || 0,
        activeUsers: usersData.filter((u: any) => u.status === "ACTIVE").length || 0,
      });

      setRecentLogs(auditData.logs || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="view_dashboard">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user?.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{stats.users}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Permissions</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{stats.permissions}</p>
              </div>
              <div className="text-4xl">🔑</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Active Users</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{stats.activeUsers}</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Audit Events</p>
                <p className="text-4xl font-bold text-slate-900 mt-2">{stats.auditLogs}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Resource</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.actor.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.resourceType}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
