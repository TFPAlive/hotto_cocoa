import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid
  if (!userid) return res.status(401).json({ error: 'User not authenticated' })

  try {
    const conn = await getConnection()

    // Note: UserSettings table should be created using database/03_security_tables.sql

    if (req.method === 'GET') {
      // Get user's localization settings
      const [settingsRows] = await conn.execute(`
        SELECT 
          language,
          currency,
          region,
          date_format,
          time_format,
          number_format,
          first_day_of_week
        FROM UserSettings
        WHERE userid = ?
      `, [userid])

      let settings = {
        language: 'ja',
        currency: 'JPY',
        region: 'JP',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        numberFormat: 'comma',
        firstDayOfWeek: 1
      }

      if (Array.isArray(settingsRows) && (settingsRows as any).length > 0) {
        const dbSettings = (settingsRows as any)[0]
        settings = {
          language: dbSettings.language,
          currency: dbSettings.currency,
          region: dbSettings.region,
          dateFormat: dbSettings.date_format,
          timeFormat: dbSettings.time_format,
          numberFormat: dbSettings.number_format,
          firstDayOfWeek: dbSettings.first_day_of_week
        }
      }

      return res.status(200).json(settings)
    }

    if (req.method === 'PUT') {
      const { 
        language, 
        currency, 
        region, 
        dateFormat, 
        timeFormat, 
        numberFormat, 
        firstDayOfWeek 
      } = req.body

      // Validate input
      if (language && !/^[a-z]{2}$/.test(language)) {
        return res.status(400).json({ error: 'Invalid language code' })
      }

      if (currency && !/^[A-Z]{3}$/.test(currency)) {
        return res.status(400).json({ error: 'Invalid currency code' })
      }

      // Insert or update settings
      await conn.execute(`
        INSERT INTO UserSettings 
        (userid, language, currency, region, date_format, time_format, number_format, first_day_of_week)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        language = COALESCE(VALUES(language), language),
        currency = COALESCE(VALUES(currency), currency),
        region = COALESCE(VALUES(region), region),
        date_format = COALESCE(VALUES(date_format), date_format),
        time_format = COALESCE(VALUES(time_format), time_format),
        number_format = COALESCE(VALUES(number_format), number_format),
        first_day_of_week = COALESCE(VALUES(first_day_of_week), first_day_of_week),
        updatedat = CURRENT_TIMESTAMP
      `, [
        userid,
        language || 'ja',
        currency || 'JPY',
        region || 'JP',
        dateFormat || 'YYYY/MM/DD',
        timeFormat || '24h',
        numberFormat || 'comma',
        firstDayOfWeek || 1
      ])

      return res.status(200).json({ message: 'Localization settings updated successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('Localization settings handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}