"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useAuth } from "@/app/context/auth";
import { useEffect, useState } from "react";

export default function AuditPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="view_audit_log">
      <div className="p-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-600 mt-1">View all system actions and changes</p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Resource Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.actor.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.resourceType}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.reason || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
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
