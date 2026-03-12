import NodeCache from 'node-cache';
import { prisma } from '../db.js';

// Cache for 15 minutes by default
const myCache = new NodeCache({ stdTTL: 900 });

export const getCachedUserPermissions = async (userId: string): Promise<string[]> => {
  const cacheKey = `perms_${userId}`;
  const cachedPerms = myCache.get<string[]>(cacheKey);

  if (cachedPerms) {
    return cachedPerms;
  }

  // Calculate permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      },
      permissions: {
        include: { permission: true }
      }
    }
  });

  if (!user) {
    return [];
  }

  const rolePerms = new Set(user.role.permissions.map((rp: any) => rp.permission.name));

  // Apply user-specific overrides
  user.permissions.forEach((up: any) => {
    if (up.granted) {
      rolePerms.add(up.permission.name);
    } else {
      rolePerms.delete(up.permission.name);
    }
  });

  const finalPerms = Array.from(rolePerms);
  
  // Cache the result
  myCache.set(cacheKey, finalPerms);
  
  return finalPerms;
};

export const invalidateUserPermissionsCache = (userId: string) => {
  myCache.del(`perms_${userId}`);
};
