import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'

export function createAuthCookie(res: VercelResponse, user: { userid: number; email: string; role: string }) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' })
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict; Secure`)
  return { role: user.role }
}

export function clearAuthCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure')
}

export interface AuthRequest extends VercelRequest {
  user?: { userid: number; email: string; role: string }
}

export function verifyToken(req: AuthRequest, requiredRole?: string) {
  const cookie = (req.headers && (req.headers as any).cookie) || ''
  const match = cookie.match(/token=([^;]+)/)
  if (!match) return { ok: false }

  try {
    const token = match[1]
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'] | undefined
    if (!decoded || (requiredRole && decoded.role !== requiredRole)) {
      return { ok: false }
    }
    req.user = decoded
    return { ok: true, user: decoded }
  } catch (_err) {
    return { ok: false }
  }
}
