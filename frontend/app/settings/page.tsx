"use client";

import { ProtectedRoute } from "@/app/components/protected-route";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    appName: "RBAC Platform",
    supportEmail: "support@rbac.local",
    timezone: "UTC",
    theme: "dark",
    sessionTimeout: 15,
  });

  const handleSave = async () => {
    // TODO: Save settings
    alert("Settings saved!");
  };

  return (
    <ProtectedRoute requiredPermission="view_settings">
      <div className="p-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Configure system settings and preferences</p>
        </div>

        <div className="mt-8 max-w-2xl bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">General Settings</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Application Name</label>
              <input
                type="text"
                value={settings.appName}
                onChange={e => setSettings({ ...settings, appName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>UTC</option>
                <option>EST</option>
                <option>CST</option>
                <option>MST</option>
                <option>PST</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={e => setSettings({ ...settings, theme: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>Dark</option>
                <option>Light</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save Settings
              </button>
              <button className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
