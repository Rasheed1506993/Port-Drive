import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'vault_super_secret_jwt_key_2026';
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export interface ShareSessionPayload {
  shareLinkId: string;
  token: string;
  workspaceId: string;
  permittedFolderId: string | null;
  allowDownload: boolean;
}

export function createShareSessionToken(payload: ShareSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyShareSessionToken(token: string): ShareSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ShareSessionPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export interface AdminSessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function createAdminToken(payload: AdminSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSessionPayload;
    if (decoded && (decoded.role === 'SUPER_ADMIN' || decoded.role === 'admin')) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAdminTokenEdge(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES);
    if (payload && (payload.role === 'SUPER_ADMIN' || payload.role === 'admin')) {
      return payload as unknown as AdminSessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}
