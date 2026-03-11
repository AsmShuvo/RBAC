'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/context/auth';

export function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission: string }) {
  const router = useRouter();
  const { token, permissions, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push('/login');
      } else if (requiredPermission && !permissions.includes(requiredPermission)) {
        router.push('/403');
      }
    }
  }, [token, permissions, loading, router, requiredPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
