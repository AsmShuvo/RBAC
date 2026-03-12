import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export function generateAccessToken(payload: TokenPayload): string {
  const secret = config.jwt.secret || 'default-secret';
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.accessTokenExpiry,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = config.jwt.refreshSecret || 'default-refresh-secret';
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = config.jwt.secret || 'default-secret';
  return jwt.verify(token, secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = config.jwt.refreshSecret || 'default-refresh-secret';
  return jwt.verify(token, secret) as TokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch {
    return null;
  }
}
