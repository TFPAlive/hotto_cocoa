import { getConnection } from "../lib/db_conn";

export async function deleteProduct(productId: number) {
  const conn = await getConnection();
  const [result] = await conn.query("DELETE FROM products WHERE id = ?", [productId]);
  return (result as any).affectedRows > 0;
}