import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/User";
import { requireAuth } from "@/lib/auth-helper";
import bcrypt from "bcryptjs";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET single user
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    
    // Only Admin can access user management
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await ctx.params;
    await connectToDatabase();

    const foundUser = await UserModel.findById(id).select("-password").lean();

    if (!foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: foundUser,
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    
    // Only Admin can update users
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await ctx.params;
    await connectToDatabase();

    const body = await req.json();
    const { name, role, password, isActive } = body;

    const foundUser = await UserModel.findById(id);
    if (!foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update fields
    if (name !== undefined) {
      // Validate name (letters only, max 15 characters)
      const nameRegex = /^[A-Za-z\s]+$/;
      if (!nameRegex.test(name) || name.length > 15) {
        return NextResponse.json(
          { error: "Name must contain only letters and be maximum 15 characters" },
          { status: 400 }
        );
      }
      foundUser.name = name;
    }

    if (role !== undefined) {
      foundUser.role = role;
    }

    if (password !== undefined && password !== "") {
      // Validate password length
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      foundUser.password = password; // Will be hashed by pre-save hook
    }

    if (isActive !== undefined) {
      foundUser.isActive = isActive;
    }

    await foundUser.save();

    // Return user without password
    const userResponse = foundUser.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    
    // Only Admin can delete users
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await ctx.params;
    await connectToDatabase();

    const foundUser = await UserModel.findByIdAndDelete(id);

    if (!foundUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

