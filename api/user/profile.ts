import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from '../lib/auth'

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "user")) return res.status(403).end("Forbidden")

  const userid = req.user?.userid

  try {
    const conn = await getConnection()

    if (req.method === 'GET') {
      // Get user profile with phone from default address
      const [rows] = await conn.execute(`
        SELECT u.userid, u.username, u.email, a.phone, u.firstname, u.lastname, u.birthdate, u.gender, u.imageurl as avatar, u.createdat, u.updatedat
        FROM \`User\` u
        LEFT JOIN \`Address\` a ON u.userid = a.userid AND a.isdefault = 1
        WHERE u.userid = ?
      `, [userid])

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const user = (rows as any[])[0]
      return res.status(200).json(user)
    }

    if (req.method === 'PUT') {
      // Parse JSON body for profile updates
      const body = req.body || {}
      
      const username = body.username
      const email = body.email
      const phone = body.phone
      const firstname = body.firstname
      const lastname = body.lastname
      const birthdate = body.birthdate
      const gender = body.gender
      const avatarUrl = body.avatar // Avatar URL from file-handler endpoint

      // Update user profile (excluding phone)
      const updateFields = []
      const updateValues = []

      if (username !== undefined) { updateFields.push('username = ?'); updateValues.push(username) }
      if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email) }
      if (firstname !== undefined) { updateFields.push('firstname = ?'); updateValues.push(firstname) }
      if (lastname !== undefined) { updateFields.push('lastname = ?'); updateValues.push(lastname) }
      if (birthdate !== undefined) { updateFields.push('birthdate = ?'); updateValues.push(birthdate) }
      if (gender !== undefined) { updateFields.push('gender = ?'); updateValues.push(gender) }
      if (avatarUrl !== undefined) { updateFields.push('imageurl = ?'); updateValues.push(avatarUrl) }
      if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone) }

      updateFields.push('updatedat = NOW()')
      updateValues.push(userid)

      if (updateFields.length > 1) { // More than just updatedat
        const [result] = await conn.execute(
          `UPDATE \`User\` SET ${updateFields.join(', ')} WHERE userid = ?`,
          updateValues
        )

        if ((result as any).affectedRows === 0) {
          return res.status(404).json({ error: 'User not found' })
        }
      }

      return res.status(200).json({ 
        message: 'Profile updated successfully',
        ...body
      })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
    
  } catch (error) {
    console.error('User profile handler error:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}