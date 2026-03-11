"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useState } from "react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([
    {
      id: 1,
      title: "Follow up with Acme Corp",
      assignee: "Jane Agent",
      priority: "High",
      status: "In Progress",
      dueDate: "2026-03-15",
    },
    {
      id: 2,
      title: "Prepare proposal",
      assignee: "John Manager",
      priority: "Medium",
      status: "Pending",
      dueDate: "2026-03-18",
    },
  ]);

  return (
    <ProtectedRoute requiredPermission="view_tasks">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600 mt-1">Manage team tasks and activities</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            + Create Task
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Task</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Assignee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{task.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{task.assignee}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        task.priority === "High"
                          ? "bg-red-100 text-red-700"
                          : task.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{task.dueDate}</td>
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
