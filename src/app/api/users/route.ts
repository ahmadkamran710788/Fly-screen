import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { requireAuth } from "@/lib/auth-helper";
import bcrypt from "bcryptjs";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET all users with pagination
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Only Admin can access user management
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "30"));
    const status = searchParams.get("status"); // "active" | "inactive" | "all"

    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery: any = {};
    if (status && status !== "all") {
      filterQuery.isActive = status === "active";
    }

    // Fetch users and total count in parallel
    const [users, totalCount] = await Promise.all([
      UserModel.find(filterQuery)
        .select("-password") // Exclude password from response
        .sort({ createdAt: -1 }) // LIFS - Last In First Show
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filterQuery),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Only Admin can create users
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { email, password, name, role, isActive = true } = body;

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Validate name (letters only, max 15 characters)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name) || name.length > 15) {
      return NextResponse.json(
        { error: "Name must contain only letters and be maximum 15 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await UserModel.create({
      email: email.toLowerCase(),
      password,
      name,
      role,
      isActive: isActive !== false,
    });

    // Return user without password
    const userResponse = newUser.toObject() as any;
    delete userResponse.password;

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Error creating user:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

