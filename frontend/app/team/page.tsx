'use client';

import { useAuth } from '@/app/context/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/app/lib/api';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  role: { name: string };
  createdAt: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
}

export default function TeamManagementPage() {
  const { permissions, user } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!permissions.includes('manage_team')) {
      router.push('/dashboard');
      return;
    }

    fetchTeamMembers();
    fetchRoles();
    fetchAvailablePermissions();
  }, [permissions, router]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data || []);
    } catch (err: any) {
      console.error('Failed to load roles:', err);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await api.get('/permissions');
      setAvailablePermissions(response.data || []);
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/team');
      setMembers(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.email || !formData.username || !formData.password || !formData.roleId) {
        setError('All fields are required');
        return;
      }

      const response = await api.post('/team', formData);
      setMembers([...members, response.data]);
      setFormData({
        email: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        roleId: '',
      });
      setShowForm(false);
      setSuccess('Team member created successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create team member');
    }
  };

  const handleSuspendMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to suspend this member?')) return;

    try {
      setError(null);
      const reason = prompt('Enter suspension reason:');
      if (!reason) return;

      const response = await api.put(`/team/${memberId}/suspend`, { reason });
      setMembers(
        members.map((m) => (m.id === memberId ? response.data : m))
      );
      setSuccess('Member suspended successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to suspend member');
    }
  };

  const handleBanMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to ban this member? This action cannot be undone.')) return;

    try {
      setError(null);
      const reason = prompt('Enter ban reason:');
      if (!reason) return;

      const response = await api.put(`/team/${memberId}/ban`, { reason });
      setMembers(
        members.map((m) => (m.id === memberId ? response.data : m))
      );
      setSuccess('Member banned successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to ban member');
    }
  };

  const handleManageFeatures = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    setSelectedMember(member);
    
    if (member.permissions && typeof member.permissions === 'object' && !Array.isArray(member.permissions)) {
      const memberPerms = new Set<string>();
      Object.values(member.permissions).forEach((perm: any) => {
        if (perm.permission?.id) {
          memberPerms.add(perm.permission.id);
        }
      });
      setSelectedFeatures(memberPerms);
    } else {
      setSelectedFeatures(new Set());
    }
    
    setShowFeatureModal(true);
  };

  const handleSaveFeatures = async () => {
    if (!selectedMember) return;

    try {
      setError(null);
      
      // Convert selected permission IDs back to permission names
      const selectedPermNames = availablePermissions
        .filter(p => selectedFeatures.has(p.id))
        .map(p => p.name);

      const response = await api.post(`/team/${selectedMember.id}/features`, {
        permissions: selectedPermNames,
        reason: 'Updated by manager',
      });
      
      setMembers(
        members.map((m) => (m.id === selectedMember.id ? response.data : m))
      );
      setSuccess('Member features updated successfully!');
      setShowFeatureModal(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update member features');
    }
  };

  const toggleFeature = (permissionId: string) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedFeatures(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 lg:ml-64">
        <div className="text-center">Loading team members...</div>
      </div>
    );
  }

  // Group permissions by category
  const permissionsByCategory = availablePermissions.reduce(
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:ml-64">
      {/* Feature Management Modal */}
      {showFeatureModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Manage Features for {selectedMember.firstName} {selectedMember.lastName}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(permissionsByCategory).map(([category, categoryPerms]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-slate-900 mb-3 capitalize">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                      {categoryPerms.map((perm) => (
                        <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.has(perm.id)}
                            onChange={() => toggleFeature(perm.id)}
                            className="w-4 h-4 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowFeatureModal(false)}
                className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeatures}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Save Features
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Team Management</h1>
          {permissions.includes('create_team_member') && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              {showForm ? 'Cancel' : 'Add Team Member'}
            </button>
          )}
        </div>

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

        {showForm && permissions.includes('create_team_member') && (
          <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Create New Team Member</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.roleId}
                onChange={(e) =>
                  setFormData({ ...formData, roleId: e.target.value })
                }
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleCreateMember}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
              >
                Create Member
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-6 py-3 text-slate-900">
                    {member.firstName} {member.lastName}
                  </td>
                  <td className="px-6 py-3 text-slate-700">{member.email}</td>
                  <td className="px-6 py-3 text-slate-700">
                    {member.role.name}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : member.status === 'SUSPENDED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 space-x-2 flex">
                    {permissions.includes('manage_team_features') && (
                      <button
                        onClick={() => handleManageFeatures(member.id)}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        Features
                      </button>
                    )}
                    {permissions.includes('suspend_team_member') &&
                      member.status !== 'SUSPENDED' && (
                        <button
                          onClick={() => handleSuspendMember(member.id)}
                          className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition"
                        >
                          Suspend
                        </button>
                      )}
                    {permissions.includes('ban_team_member') &&
                      member.status !== 'BANNED' && (
                        <button
                          onClick={() => handleBanMember(member.id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition"
                        >
                          Ban
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {members.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No team members found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
