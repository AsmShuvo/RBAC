"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useAuth } from "@/app/context/auth";
import { useEffect, useState } from "react";
import api from '@/app/lib/api';

export default function PermissionsPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const [usersRes, permRes] = await Promise.all([
        api.get('/users?limit=100'),
        api.get('/permissions'),
      ]);

      // /users returns paginated { data: [], meta: {} }
      setUsers(usersRes.data.data ?? usersRes.data);
      setPermissions(permRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUser(userId);
    try {
      const res = await api.get(`/permissions/users/${userId}`);
      setUserPermissions(res.data.details || []);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
    }
  };

  const handleTogglePermission = async (permissionId: string, granted: boolean) => {
    try {
      if (granted) {
        await api.delete(`/permissions/users/${selectedUser}/${permissionId}`);
      } else {
        await api.post(`/permissions/users/${selectedUser}/${permissionId}`, {});
      }
      handleSelectUser(selectedUser);
    } catch (error) {
      console.error("Error toggling permission:", error);
    }
  };

  return (
    <ProtectedRoute requiredPermission="view_permissions">
      <div className="p-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Permissions</h1>
          <p className="text-slate-600 mt-1">Manage user permissions and access control</p>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-8">
          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Users</h2>
            </div>
            <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className={`w-full text-left px-6 py-3 hover:bg-slate-50 transition ${
                    selectedUser === user.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  <p className="text-xs text-slate-500">{user.role.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="col-span-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">
                {selectedUser ? `Permissions for ${users.find(u => u.id === selectedUser)?.email}` : "Select a user"}
              </h2>
            </div>

            {selectedUser ? (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {permissions.map(perm => {
                    const userPerm = userPermissions.find(up => up.permissionId === perm.id);
                    return (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{perm.name}</p>
                          <p className="text-xs text-slate-500">{perm.category}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={userPerm?.granted || false}
                          onChange={() => handleTogglePermission(perm.id, userPerm?.granted || false)}
                          className="w-5 h-5 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Select a user to manage their permissions
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
