// src/lib/jwt.ts
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@/types/order";

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  [key: string]: unknown;
}

const EXPIRES_IN = "7d"; // You can also use seconds (e.g., "604800s")

// ✅ Sign token (Edge + Node safe)
export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);

  return token;
}

// ✅ Verify token (Edge + Node safe)
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as JWTPayload;
  } catch (err) {
    console.error("JWT verification error:", err);
    throw new Error("Invalid or expired token");
  }
}
