import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getConnection } from '../lib/db_conn'
import { AuthRequest, verifyToken } from "../lib/auth";

export default async function handler(req: AuthRequest, res: VercelResponse) {
  if (!verifyToken(req, "admin")) return res.status(403).end("Forbidden");
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const conn = await getConnection()

    // Total orders
    const [ordersCntRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `Order`')
    // @ts-ignore
    const orders = (Array.isArray(ordersCntRows) && (ordersCntRows as any)[0]) ? Number((ordersCntRows as any)[0].cnt) : 0

    // Total products
    const [productsCntRows] = await conn.execute('SELECT COUNT(*) as cnt FROM Product')
    // @ts-ignore
    const products = (Array.isArray(productsCntRows) && (productsCntRows as any)[0]) ? Number((productsCntRows as any)[0].cnt) : 0

    // Total users
    const [usersCntRows] = await conn.execute('SELECT COUNT(*) as cnt FROM `User`')
    // @ts-ignore
    const users = (Array.isArray(usersCntRows) && (usersCntRows as any)[0]) ? Number((usersCntRows as any)[0].cnt) : 0

    // Revenue: sum of completed/paid orders
    // Assumption: revenue is sum of totalamount for orders whose status indicates completion/payment.
    const [revenueRows] = await conn.execute("SELECT IFNULL(SUM(totalamount),0) AS revenue FROM `Order` WHERE status IN ('paid','completed','shipped','delivered')")
    // @ts-ignore
    const revenue = (Array.isArray(revenueRows) && (revenueRows as any)[0]) ? Number((revenueRows as any)[0].revenue) : 0

    // Recent orders (latest 10)
    const [recentRows] = await conn.execute(
      `SELECT o.orderid, u.username, o.totalamount, o.status, DATE_FORMAT(o.createdat, '%Y-%m-%d') as date
       FROM \`Order\` o
       LEFT JOIN \`User\` u ON o.userid = u.userid
       ORDER BY o.createdat DESC
       LIMIT 10`
    )
    // @ts-ignore
    const recent = Array.isArray(recentRows) ? (recentRows as any) : []

    return res.status(200).json({ stats: { orders, products, users, revenue }, recentOrders: recent })
  } catch (err) {
    console.error('admin/dashboard error:', err)
    return res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
}