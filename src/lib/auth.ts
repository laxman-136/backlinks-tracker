import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  memberId: string;
  name: string;
  username: string;
  role: 'team' | 'admin';
  assignedCourses: string[];
  assignedProperty: string;
  mustChangePassword: boolean;
}

// Password hashing
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// JWT generation (24hr expiry)
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });
}

// Token verification
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JWTPayload;
  } catch {
    return null;
  }
}

// Cookie parser utility
export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (const c of cookies) {
    const [key, value] = c.trim().split('=');
    if (key === name) return value;
  }
  return null;
}

// Middleware — reads cookie, returns member info
export function getAuthFromRequest(request: Request): JWTPayload | null {
  const cookie = request.headers.get('cookie');
  const token = parseCookie(cookie, 'seo_auth');
  if (!token) return null;
  return verifyToken(token);
}

// Role check helpers
export function requireAuth(auth: JWTPayload | null): JWTPayload {
  if (!auth) throw new Error('Unauthorized');
  return auth;
}

export function requireAdmin(auth: JWTPayload | null): JWTPayload {
  if (!auth || auth.role !== 'admin') throw new Error('Admin required');
  return auth;
}

// Data isolation — team members only see their own backlinks
export function getMemberFilter(auth: JWTPayload) {
  if (auth.role === 'admin') return {};           // no filter
  return { member_id: auth.memberId };            // filter to own data
}
