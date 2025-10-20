import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    // Note: SecuritySettings table should be created using database/03_security_tables.sql

    if (req.method === 'GET') {
      // Get user's security settings
      const [settingsRows] = await conn.execute(`
        SELECT 
          two_factor_enabled,
          email_notifications,
          login_notifications,
          marketing_emails,
          data_collection,
          session_timeout
        FROM SecuritySettings
        WHERE userid = ?
      `, [userid])

      let settings = {
        twoFactorEnabled: false,
        emailNotifications: true,
        loginNotifications: true,
        marketingEmails: false,
        dataCollection: false,
        sessionTimeout: 30
      }

      if (Array.isArray(settingsRows) && (settingsRows as any).length > 0) {
        const dbSettings = (settingsRows as any)[0]
        settings = {
          twoFactorEnabled: !!dbSettings.two_factor_enabled,
          emailNotifications: !!dbSettings.email_notifications,
          loginNotifications: !!dbSettings.login_notifications,
          marketingEmails: !!dbSettings.marketing_emails,
          dataCollection: !!dbSettings.data_collection,
          sessionTimeout: dbSettings.session_timeout || 30
        }
      }

      return res.status(200).json(settings)
    }

    if (req.method === 'PUT') {
      const { 
        twoFactorEnabled, 
        emailNotifications, 
        loginNotifications, 
        marketingEmails, 
        dataCollection, 
        sessionTimeout 
      } = req.body

      // Insert or update settings
      await conn.execute(`
        INSERT INTO SecuritySettings 
        (userid, two_factor_enabled, email_notifications, login_notifications, 
         marketing_emails, data_collection, session_timeout)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        two_factor_enabled = COALESCE(VALUES(two_factor_enabled), two_factor_enabled),
        email_notifications = COALESCE(VALUES(email_notifications), email_notifications),
        login_notifications = COALESCE(VALUES(login_notifications), login_notifications),
        marketing_emails = COALESCE(VALUES(marketing_emails), marketing_emails),
        data_collection = COALESCE(VALUES(data_collection), data_collection),
        session_timeout = COALESCE(VALUES(session_timeout), session_timeout),
        updatedat = CURRENT_TIMESTAMP
      `, [
        userid,
        twoFactorEnabled !== undefined ? twoFactorEnabled : false,
        emailNotifications !== undefined ? emailNotifications : true,
        loginNotifications !== undefined ? loginNotifications : true,
        marketingEmails !== undefined ? marketingEmails : false,
        dataCollection !== undefined ? dataCollection : false,
        sessionTimeout || 30
      ])

      return res.status(200).json({ message: 'Security settings updated successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Security settings handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}