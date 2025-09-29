import type { VercelRequest } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export interface AuthRequest extends VercelRequest {
	user ? : { userid: number; email: string; role: string; };
}

export function verifyToken(req: AuthRequest, requiredRole ? : string) {
	const cookie = req.headers.cookie || "";
	const match = cookie.match(/token=([^;]+)/);
	if (!match) return { ok: false };

	try {
		const token = match[1];
		const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"] | undefined;
		if (!decoded || (requiredRole && decoded.role !== requiredRole)) {
			return { ok: false };
		}
		return { ok: true, user: decoded };
	} catch {
		return { ok: false };
	}
}