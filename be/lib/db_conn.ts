import mysql from "mysql2/promise";
import type { Connection } from "mysql2/promise";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";
import { GoogleAuth } from "google-auth-library";

let connection: Connection | null = null; // properly typed

export async function getConnection() {
  if (connection) return connection;

  // Authenticate with service account from env
  const auth = new GoogleAuth({
    credentials: JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ??
        (() => { throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON env variable is not set"); })()
    ),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const connector = new Connector({ auth });

  // Generate secure connection options
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  if (!instanceConnectionName) {
    throw new Error("INSTANCE_CONNECTION_NAME env variable is not set");
  }
  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    ipType: IpAddressTypes.PUBLIC,
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