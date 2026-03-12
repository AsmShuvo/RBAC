import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { getCachedUserPermissions } from '../services/permissionCache.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        permissions: string[];
      };
      token?: string;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token) as any;

    try {
      // Get fresh permissions from cache/DB
      const freshPermissions = await getCachedUserPermissions(payload.userId);
      
      req.user = {
        ...payload,
        permissions: freshPermissions.length > 0 ? freshPermissions : payload.permissions
      };
    } catch (dbError) {
      // Fallback to JWT permissions if DB/cache fails
      req.user = payload;
    }
    
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export function permissionMiddleware(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const hasPermission = requiredPermissions.some(perm =>
      req.user?.permissions.includes(perm)
    );

    if (!hasPermission) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
