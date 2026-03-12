"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useAuth } from "@/app/context/auth";
import { useEffect, useState } from "react";
import api from '@/app/lib/api';

export default function DashboardPage() {
  const { user, token, permissions } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    permissions: 0,
    auditLogs: 0,
    activeUsers: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check distinct permissions
  const canViewStats = permissions.includes("view_stats") || permissions.includes("view_dashboard");

  useEffect(() => {
    if (token) {
      if (canViewStats) {
        fetchStats();
      } else {
        setLoading(false);
      }
    }
  }, [token, canViewStats]);

  const fetchStats = async () => {
    try {
      // In a real app we'd have a specific /stats endpoint, but here we query components
      // if the user has permission to see the dashboard, they might have access to some of these.
      // We wrap in individual try/catches to avoid one 403 failing the whole dashboard fetch.
      let usersData = { data: [] };
      let permData = [];
      let auditData = { total: 0, logs: [] };

      try {
        const res = await api.get('/users?limit=100');
        usersData = res.data;
      } catch (e) {}

      try {
        const res = await api.get('/permissions');
        permData = res.data;
      } catch (e) {}

      try {
        const res = await api.get('/audit?limit=5');
        auditData = res.data;
      } catch (e) {}

      setStats({
        users: usersData.data?.length || 0,
        permissions: permData.length || 0,
        auditLogs: auditData.total || 0,
        activeUsers: usersData.data?.filter((u: any) => u.status === "ACTIVE").length || 0,
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
          <p className="text-slate-600">Welcome back, {user?.firstName || user?.email}</p>
        </div>

        {/* Stats Grid */}
        {canViewStats && (
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
        )}

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
