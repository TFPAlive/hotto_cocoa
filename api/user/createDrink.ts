import { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }