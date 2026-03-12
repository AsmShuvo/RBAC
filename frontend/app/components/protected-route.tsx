'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/auth';
import api from '@/app/lib/api';

export function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission: string }) {
  const router = useRouter();
  const { token, permissions, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && token) {
      const validateAccess = async () => {
        try {
          const response = await api.get('/auth/me');
          const currentPermissions = response.data?.user?.permissions || [];
          
          if (requiredPermission && !currentPermissions.includes(requiredPermission)) {
            router.push('/403');
            return;
          }
          
          setHasAccess(true);
        } catch (error) {
          setHasAccess(false);
          router.push('/login');
        }
      };

      if (requiredPermission) {
        validateAccess();
      } else {
        setHasAccess(true);
      }

      const interval = setInterval(validateAccess, 30000);
      return () => clearInterval(interval);
    } else if (!loading && !token) {
      router.push('/login');
    }
  }, [token, loading, router, requiredPermission]);

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push('/login');
      } else if (requiredPermission && !permissions.includes(requiredPermission)) {
        router.push('/403');
      }
    }
  }, [token, permissions, loading, router, requiredPermission]);

  if (loading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || hasAccess === false) {
    return null;
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
