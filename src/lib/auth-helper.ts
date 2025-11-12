// src/lib/auth-helper.ts
import { NextRequest } from "next/server";
import { verifyToken, JWTPayload } from "./jwt";

export async function getUserFromRequest(
  req: NextRequest
): Promise<JWTPayload | null> {
  try {
    // Try to get from cookie first
    const token = req.cookies.get("auth-token")?.value;

    if (token) {
      return await verifyToken(token);
    }

    // Try Authorization header as fallback
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const bearerToken = authHeader.substring(7);
      return await verifyToken(bearerToken);
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<JWTPayload> {
  const user = await requireAuth(req);
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return user;
}
