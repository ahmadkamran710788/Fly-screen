// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("🚪 Processing logout request");

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the auth cookie
    response.cookies.set({
      name: "auth-token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    console.log("✅ Auth cookie cleared");

    return response;
  } catch (error) {
    console.error("❌ Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
