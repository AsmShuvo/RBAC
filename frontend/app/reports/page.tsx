"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useState } from "react";

export default function ReportsPage() {
  const [reports] = useState<any[]>([
    {
      id: 1,
      name: "Q1 Sales Performance",
      date: "2026-03-11",
      revenue: "$250,000",
      leads: 145,
      conversion: "18%",
    },
    {
      id: 2,
      name: "Team Activity Report",
      date: "2026-03-10",
      revenue: "$85,000",
      leads: 52,
      conversion: "12%",
    },
  ]);

  return (
    <ProtectedRoute requiredPermission="view_reports">
      <div className="p-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600 mt-1">View analytics and business performance</p>
        </div>

        <div className="grid grid-cols-4 gap-6 mt-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">$335,000</p>
            <p className="text-xs text-green-600 mt-2">↑ 12% vs last week</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Total Leads</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">197</p>
            <p className="text-xs text-green-600 mt-2">↑ 8% vs last week</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Conversion Rate</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">15%</p>
            <p className="text-xs text-slate-500 mt-2">Consistent</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm font-medium">Avg Deal Size</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">$41,875</p>
            <p className="text-xs text-green-600 mt-2">↑ 5% vs last week</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Recent Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Report Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Leads</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{report.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.date}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{report.revenue}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{report.leads}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{report.conversion}</td>
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
