import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

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

    // 2️⃣ Verify the token and extract the payload
    const userPayload = await verifyToken(token);

    console.log("✅ User verified:", userPayload.email);

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
    // If token verification fails, return 401 Unauthorized
    if (error instanceof Error && error.message.includes("Invalid or expired token")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
