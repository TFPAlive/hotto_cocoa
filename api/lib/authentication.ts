import type { VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export function createAuthCookie(
  res: VercelResponse,
  user: { userId: number; email: string; role: string }
) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });

  res.setHeader(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict; Secure`
  );

  return { role: user.role }; // frontend uses this to redirect
}

export function clearAuthCookie(res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure"
  );
}
