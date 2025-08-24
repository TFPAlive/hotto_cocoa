import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export interface AuthRequest extends VercelRequest {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export function verifyToken(req: AuthRequest, res: VercelResponse): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid token" });
    return false;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = decoded;
    return true;
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return false;
  }
}