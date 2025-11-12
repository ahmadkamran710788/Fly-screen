import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Checking authentication for /api/auth/me");

    // 1️⃣ Try to get the token (from cookie or header)
    const token =
      req.cookies.get("auth-token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("❌ No token found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2️⃣ Decode the token without verifying (useful for reading payload only)
    const userPayload = decodeToken(token);

    if (!userPayload) {
      console.log("❌ Invalid or malformed token");
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    console.log("✅ User decoded:", userPayload.email);

    // 3️⃣ Return user data extracted from token
    return NextResponse.json({
      success: true,
      user: {
        id: userPayload.userId,
        email: userPayload.email,
        name: userPayload.name,
        role: userPayload.role,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
