import { Request, Response } from 'express';
import { prisma } from '../db.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: `User is ${user.status.toLowerCase()}` });
      return;
    }

    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Resolve user permissions: role permissions + user overrides
    const rolePermissions = new Set(
      user.role.permissions
        .map(rp => rp.permission.name)
    );
    
    // Apply user-specific overrides (granted = true adds, granted = false removes)
    user.permissions.forEach(up => {
      if (up.granted) {
        rolePermissions.add(up.permission.name);
      } else {
        rolePermissions.delete(up.permission.name);
      }
    });
    
    const permissions = Array.from(rolePermissions);

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (req.user) {
      // Revoke the refresh token
      await prisma.refreshToken.updateMany({
        where: { userId: req.user.userId },
        data: { revokedAt: new Date() },
      });
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    // Check if token is revoked
    const tokenInDb = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenInDb || tokenInDb.revokedAt) {
      res.status(401).json({ error: 'Refresh token revoked' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'User not active' });
      return;
    }

    const permissions = user.permissions
      .filter(up => up.granted)
      .map(up => up.permission.name);

    const newTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const newAccessToken = generateAccessToken(newTokenPayload);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      res.status(400).json({ error: 'Email, username, and password are required' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email or username already exists' });
      return;
    }

    // Get default Agent role
    const agentRole = await prisma.role.findFirst({
      where: { name: 'Agent' },
    });

    if (!agentRole) {
      res.status(500).json({ error: 'Default role not found' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: agentRole.id,
      },
      include: {
        role: true,
        permissions: {
          include: { permission: true },
        },
      },
    });

    const permissions = newUser.permissions
      .filter(up => up.granted)
      .map(up => up.permission.name);

    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role.name,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: newUser.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: `User is ${user.status.toLowerCase()}` });
      return;
    }

    const rolePermissions = new Set(
      user.role.permissions.map(rp => rp.permission.name)
    );
    
    user.permissions.forEach(up => {
      if (up.granted) {
        rolePermissions.add(up.permission.name);
      } else {
        rolePermissions.delete(up.permission.name);
      }
    });
    
    const permissions = Array.from(rolePermissions);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
