import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    // Note: LoginSessions table should be created using database/03_security_tables.sql

    if (req.method === 'GET') {
      // Get user's active login sessions
      const [sessionRows] = await conn.execute(`
        SELECT 
          sessionid,
          device_info,
          ip_address,
          location,
          createdat,
          last_activity,
          is_current
        FROM LoginSessions
        WHERE userid = ?
        ORDER BY last_activity DESC
      `, [userid])

      return res.status(200).json(sessionRows)
    }

    if (req.method === 'POST') {
      // Create new login session (typically called during login)
      const { sessionid, device_info, ip_address, location } = req.body

      if (!sessionid) {
        return res.status(400).json({ error: 'Session ID is required' })
      }

      // Mark all existing sessions as not current
      await conn.execute('UPDATE LoginSessions SET is_current = FALSE WHERE userid = ?', [userid])

      // Insert new session
      await conn.execute(`
        INSERT INTO LoginSessions (sessionid, userid, device_info, ip_address, location, is_current) 
        VALUES (?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE 
        last_activity = CURRENT_TIMESTAMP, 
        is_current = TRUE
      `, [sessionid, userid, device_info, ip_address, location])

      return res.status(201).json({ message: 'Login session created successfully' })
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Login sessions handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}