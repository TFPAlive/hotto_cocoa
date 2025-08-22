import mysql from "mysql2/promise";
import { Connector } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth } from "google-auth-library";

let connection; // reuse connection between calls

export async function getConnection() {
  if (connection) return connection;

  // Authenticate with service account from env
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const connector = new Connector({ auth });

  // Generate secure connection options
  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    ipType: "PUBLIC",
  });

  // Create a pooled connection
  connection = await mysql.createConnection({
    ...clientOpts,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  return connection;
}