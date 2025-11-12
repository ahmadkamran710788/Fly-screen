// src/app/api/auth/register/route.ts (Optional - for creating new users)
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password, name, role } = body;

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const user = await UserModel.create({
      email,
      password,
      name,
      role,
      isActive: true,
    });

    // Generate JWT token
    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
