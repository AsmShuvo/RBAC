'use client';

import { useAuth } from '@/app/context/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  permission: string;
  icon: string;
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', permission: 'view_dashboard', icon: '📊' },
  { label: 'Users', href: '/users', permission: 'view_users', icon: '👥' },
  { label: 'Permissions', href: '/permissions', permission: 'view_permissions', icon: '🔑' },
  { label: 'Leads', href: '/leads', permission: 'view_leads', icon: '📱' },
  { label: 'Tasks', href: '/tasks', permission: 'view_tasks', icon: '✓' },
  { label: 'Reports', href: '/reports', permission: 'view_reports', icon: '📈' },
  { label: 'Audit Log', href: '/audit', permission: 'view_audit_log', icon: '📝' },
  { label: 'Settings', href: '/settings', permission: 'view_settings', icon: '⚙️' },
  { label: 'Customer Portal', href: '/customer', permission: 'view_customer_portal', icon: '🌐' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { permissions, logout, user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = sidebarItems.filter(item => permissions.includes(item.permission));

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 text-white p-2 rounded-lg"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl z-40 transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            RBAC
          </h2>
          <p className="text-xs text-slate-400 mt-1">{user?.role || 'User'}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-160px)]">
          {visibleItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname === item.href
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-950">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
