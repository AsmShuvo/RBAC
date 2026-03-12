'use client';

import { useAuth } from '@/app/context/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import api from '@/app/lib/api';

interface Permission {
  id: string;
  name: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: number;
  permissionCount: number;
  userCount: number;
  permissions: Permission[];
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
  }>;
}

export default function PermissionsPage() {
  const { permissions, user } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refresh permissions (called after actions only, not continuously)
  const refreshPermissions = useCallback(async () => {
    try {
      const [rolesRes, permRes] = await Promise.all([
        api.get('/permissions/roles/list'),
        api.get('/permissions'),
      ]);

      setRoles(rolesRes.data || []);
      setAllPermissions(permRes.data || []);

      window.dispatchEvent(new Event('permissionsUpdated'));
    } catch (err) {
      console.error('Error refreshing permissions:', err);
    }
  }, []);

  useEffect(() => {
    if (!permissions.includes('view_permissions')) {
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [rolesRes, permRes] = await Promise.all([
          api.get('/permissions/roles/list'),
          api.get('/permissions'),
        ]);

        const rolesData = rolesRes.data || [];
        const permsData = permRes.data || [];
        
        setRoles(rolesData);
        setAllPermissions(permsData);
        
        if (rolesData.length > 0) {
          setSelectedRoleId(rolesData[0].id);
        }
      } catch (err: any) {
        console.error('Error loading permissions:', err);
        setError(err.response?.data?.error || 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // No auto-refresh to prevent infinite reload loops
    // Only refresh on explicit user actions (grant/revoke)
  }, [permissions, router]);

  const handleGrantPermission = async (permissionId: string) => {
    if (!selectedRoleId) return;

    try {
      setError(null);
      await api.post(`/permissions/roles/${selectedRoleId}/${permissionId}`, {
        reason: `Permission granted to role by ${user?.email}`,
      });

      setSuccess('Permission granted successfully!');
      await refreshPermissions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant permission');
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!selectedRoleId) return;

    try {
      setError(null);
      await api.delete(`/permissions/roles/${selectedRoleId}/${permissionId}`, {
        data: { reason: `Permission revoked from role by ${user?.email}` },
      });

      setSuccess('Permission revoked successfully!');
      await refreshPermissions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke permission');
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const selectedRolePermissions = new Set(
    selectedRole?.permissions.map((p) => p.id) || []
  );

  const groupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      const category = perm.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:ml-64">
        <div className="text-center">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:ml-64">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Permissions Management</h1>
        <p className="text-slate-600 mb-6">Manage role-based permissions</p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-6">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-semibold text-slate-900">Roles</h2>
              </div>
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`w-full text-left px-4 py-3 transition ${
                      selectedRoleId === role.id
                        ? 'bg-blue-50 border-l-4 border-l-blue-600 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-sm font-medium">{role.name}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {role.permissionCount} permissions • {role.userCount} users
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedRole.name}
                      </h2>
                      <p className="text-slate-600 text-sm mt-1">
                        {selectedRole.description}
                      </p>
                      <p className="text-slate-500 text-xs mt-2">
                        {selectedRole.userCount} user(s) with this role
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 capitalize">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const isGranted = selectedRolePermissions.has(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className="flex items-center p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                            >
                              <input
                                type="checkbox"
                                checked={isGranted}
                                onChange={() => {
                                  if (isGranted) {
                                    handleRevokePermission(perm.id);
                                  } else {
                                    handleGrantPermission(perm.id);
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-slate-900">
                                  {perm.name}
                                </p>
                              </div>
                              <div
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  isGranted
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isGranted ? 'Granted' : 'Not Granted'}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Users with this role */}
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Users with {selectedRole.name} role
                  </h3>
                  {selectedRole.users.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedRole.users.map((u) => (
                        <div
                          key={u.id}
                          className="p-3 bg-white rounded border border-slate-200"
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-slate-600">{u.email}</p>
                          <span
                            className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded ${
                              u.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {u.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm">
                      No users assigned to this role yet
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-slate-600">Select a role to manage permissions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
