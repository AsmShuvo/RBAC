"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useState } from "react";

export default function CustomerPortalPage() {
  const [tickets] = useState<any[]>([
    {
      id: "TKT-001",
      subject: "Unable to access dashboard",
      status: "Open",
      priority: "High",
      created: "2026-03-10",
    },
    {
      id: "TKT-002",
      subject: "Password reset request",
      status: "Resolved",
      priority: "Low",
      created: "2026-03-09",
    },
  ]);

  return (
    <ProtectedRoute requiredPermission="view_customer_portal">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Customer Portal</h1>
          <p className="text-slate-600 mt-1">View and manage your support tickets</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm">Open Tickets</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">1</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm">Resolved Tickets</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">5</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-600 text-sm">Avg Response Time</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">2h 34m</p>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            + Create Ticket
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ticket ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{ticket.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{ticket.subject}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.status === "Open"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        ticket.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{ticket.created}</td>
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
