import { VercelRequest, VercelResponse } from "@vercel/node";
import { getConnection } from "../../lib/db_conn";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		const { id } = req.query;
		const productId = Array.isArray(id) ? parseInt(id[0]) : parseInt(String(id));

		if (!productId || isNaN(productId)) {
			return res.status(400).json({ error: 'Invalid product ID' });
		}

		if (req.method === 'GET') {
			const connection = await getConnection();
			
			const [rows] = await connection.execute(
				"SELECT * FROM Product WHERE productid = ?", 
				[productId]
			);
			
			const products = rows as any[];
			
			if (products.length === 0) {
				return res.status(404).json({ error: 'Product not found' });
			}

			return res.status(200).json(products[0]);
		}

		res.setHeader('Allow', ['GET']);
		return res.status(405).end();
	} catch (error) {
		console.error('Product detail handler error:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}