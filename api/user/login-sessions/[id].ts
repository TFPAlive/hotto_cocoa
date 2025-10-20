import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../../lib/db_conn'
import { AuthRequest, verifyToken } from '../../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  const { id } = req.query

  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Valid session ID is required' })
  }

  const sessionid = String(id)

  try {
    const conn = await getConnection()

    if (req.method === 'DELETE') {
      // Check if session belongs to user
      const [existingRows] = await conn.execute(
        'SELECT sessionid FROM LoginSessions WHERE sessionid = ? AND userid = ?',
        [sessionid, userid]
      )

      if (!Array.isArray(existingRows) || (existingRows as any).length === 0) {
        return res.status(404).json({ error: 'Session not found' })
      }

      // Delete the session
      await conn.execute(
        'DELETE FROM LoginSessions WHERE sessionid = ? AND userid = ?',
        [sessionid, userid]
      )

      return res.status(200).json({ message: 'Session revoked successfully' })
    }

    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Login session by ID handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}