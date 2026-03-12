"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useAuth } from "@/app/context/auth";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  customer?: { id: string; username: string; firstName?: string; lastName?: string };
  assignee?: { id: string; username: string; firstName?: string; lastName?: string };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "Medium",
  });

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer-portal/tickets", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data || []);
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load support tickets",
        });
      }
    } catch (error) {
      console.error("Fetch tickets error:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load support tickets",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.subject.trim() || !formData.description.trim()) {
      setIsSubmitting(false);
      await Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Subject and description are required",
      });
      return;
    }

    try {
      const response = await fetch("/api/customer-portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.subject,
          description: formData.description,
          priority: formData.priority.toUpperCase(),
        }),
      });

      if (response.ok) {
        const newTicket = await response.json();
        setTickets([newTicket, ...tickets]);
        setShowModal(false);
        setFormData({
          subject: "",
          description: "",
          priority: "Medium",
        });

        await Swal.fire({
          icon: "success",
          title: "Ticket Created!",
          text: "Support ticket has been created successfully",
          timer: 2000,
        });
      } else if (response.status === 403) {
        await Swal.fire({
          icon: "error",
          title: "Permission Denied",
          text: "You don't have permission to create support tickets",
        });
      } else {
        const error = await response.json();
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error.error || "Failed to create support ticket",
        });
      }
    } catch (error) {
      console.error("Create ticket error:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create support ticket",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserName = (user: any) => {
    return user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "NORMAL":
        return "bg-yellow-100 text-yellow-700";
      case "LOW":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-700";
      case "RESOLVED":
        return "bg-green-100 text-green-700";
      case "CLOSED":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <ProtectedRoute requiredPermission="view_support_tickets">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-slate-600 mt-1">
              {user?.role?.name === "Customer"
                ? "Manage your support requests"
                : "Manage customer support tickets"}
            </p>
          </div>
          {(user?.role?.name === "Customer" || user?.permissions?.some(p => p.slug === "create_support_ticket")) && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              + Create Ticket
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <span className="text-2xl animate-spin">⏳</span>
            <p className="text-slate-600 mt-2">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-600">No support tickets yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Ticket #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Subject
                    </th>
                    {user?.role?.name !== "Customer" && (
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                        Customer
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{ticket.title}</p>
                          <p className="text-xs text-slate-500 mt-1 truncate">{ticket.description}</p>
                        </div>
                      </td>
                      {user?.role?.name !== "Customer" && (
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {ticket.customer ? getUserName(ticket.customer) : "-"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ticket.assignee ? getUserName(ticket.assignee) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Create Support Ticket</h2>

              <form onSubmit={handleCreateTicket}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Enter ticket subject"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter ticket description"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span> Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
