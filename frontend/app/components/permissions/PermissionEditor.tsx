'use client';

import { useState, useEffect } from 'react';
import api from '@/app/lib/api';
import { useAuth } from '@/app/context/auth';

interface PermissionEditorProps {
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

export function PermissionEditor({ userId, onClose, onSave }: PermissionEditorProps) {
  const { permissions: granterPermissions } = useAuth();
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  const [modifiedPermissions, setModifiedPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [permsRes, userPermsRes] = await Promise.all([
        api.get('/permissions'),
        api.get(`/permissions/users/${userId}`),
      ]);
      setAllPermissions(permsRes.data);
      // userPermsRes.data.details looks like { permissionId: "p1", name: "xx", granted: true/false, source: 'role'/'user_override' }
      setUserPermissions(userPermsRes.data.details || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permId: string) => {
    // Check if there's a modified state first
    if (modifiedPermissions[permId] !== undefined) {
      return modifiedPermissions[permId];
    }
    // Otherwise check original state
    const current = userPermissions.find((p) => p.permissionId === permId);
    return current ? current.granted : false;
  };

  const getPermissionSource = (permId: string) => {
    const current = userPermissions.find((p) => p.permissionId === permId);
    return current ? current.source : null;
  };

  const handleToggle = (permId: string, permName: string) => {
    // Grant Ceiling Check: Can the granter toggle this?
    if (!granterPermissions.includes(permName)) {
      setError(`Grant Ceiling Enforcement Error: You do not have the '${permName}' permission, so you cannot grant or revoke it.`);
      setTimeout(() => setError(''), 4000);
      return;
    }

    setModifiedPermissions((prev) => ({
      ...prev,
      [permId]: !hasPermission(permId),
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const payloadPermissions = Object.keys(modifiedPermissions).map((permId) => ({
        permissionId: permId,
        granted: modifiedPermissions[permId],
      }));

      if (payloadPermissions.length === 0) {
        onClose();
        return;
      }

      await api.put(`/permissions/users/${userId}`, {
        permissions: payloadPermissions,
        reason: 'Manual update via UI',
      });
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit User Permissions</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded sticky top-0 z-10">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(groupedPermissions).map((category) => (
                <div key={category} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 capitalize">
                    {category} Module
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedPermissions[category].map((perm: any) => {
                      const isGranted = hasPermission(perm.id);
                      const source = getPermissionSource(perm.id);
                      const canEdit = granterPermissions.includes(perm.name);
                      
                      return (
                        <div 
                          key={perm.id} 
                          className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                            !canEdit ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200' :
                            isGranted ? 'bg-blue-50 border-blue-200 cursor-pointer' : 'bg-white border-slate-200 cursor-pointer hover:border-blue-300'
                          }`}
                          onClick={() => canEdit && handleToggle(perm.id, perm.name)}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                              checked={isGranted}
                              readOnly
                              disabled={!canEdit}
                            />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <label className={`text-sm font-medium ${isGranted ? 'text-blue-900' : 'text-slate-700'} cursor-pointer`}>
                              {perm.name}
                            </label>
                            {perm.description && (
                              <p className="text-xs text-slate-500 mt-1">{perm.description}</p>
                            )}
                            {source === 'role' && !modifiedPermissions[perm.id] && (
                              <span className="text-[10px] mt-1 font-semibold text-slate-400 uppercase tracking-wider">Role Default</span>
                            )}
                            {source === 'user_override' && !modifiedPermissions[perm.id] && (
                              <span className="text-[10px] mt-1 font-semibold text-blue-500 uppercase tracking-wider">Direct Override</span>
                            )}
                            {modifiedPermissions[perm.id] !== undefined && (
                              <span className="text-[10px] mt-1 font-semibold text-orange-500 uppercase tracking-wider">Pending Change</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
