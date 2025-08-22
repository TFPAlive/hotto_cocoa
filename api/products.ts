import mysql from "mysql2/promise";
import { Connector } from "@google-cloud/cloud-sql-connector";

export default async function products(req, res) {
  try {
    // Create a connector instance
    const connector = new Connector();

    // Get secure connection options for Cloud SQL
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME, // format: project:region:instance
      ipType: "PUBLIC", // can also use "PRIVATE" if needed
    });

    // Create the connection
    const connection = await mysql.createConnection({
      ...clientOpts,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    const [rows] = await connection.execute("SELECT * FROM products");
    await connection.end();

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}