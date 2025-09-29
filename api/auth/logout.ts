import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearAuthCookie } from "../lib/authentication";

export default function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	clearAuthCookie(res);
	return res.json({ message: "Logged out" });
}
