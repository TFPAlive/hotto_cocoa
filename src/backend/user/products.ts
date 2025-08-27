import { getConnection } from "../lib/db";

import type { Request, Response } from "express";

export default async function products(req: Request, res: Response) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute("SELECT * FROM Product");

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}