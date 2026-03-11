"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useState } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([
    {
      id: 1,
      name: "Acme Corp",
      email: "contact@acme.com",
      status: "Qualified",
      value: "$50,000",
      date: "2026-03-11",
    },
    {
      id: 2,
      name: "Tech Startup Inc",
      email: "hello@techstartup.com",
      status: "Contacted",
      value: "$30,000",
      date: "2026-03-10",
    },
  ]);

  return (
    <ProtectedRoute requiredPermission="view_leads">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Leads</h1>
            <p className="text-slate-600 mt-1">Manage sales leads and opportunities</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            + New Lead
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{lead.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{lead.value}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lead.date}</td>
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
