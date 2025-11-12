// scripts/seed-users.js
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    email: String,
    password: String,
    role: String,
    name: String,
    isActive: Boolean,
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedUsers() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    const users = [
      {
        email: "admin@company.com",
        password: "admin123",
        role: "Admin",
        name: "Admin User",
        isActive: true,
      },
      {
        email: "frame@company.com",
        password: "frame123",
        role: "Frame Cutting",
        name: "Frame Cutter",
        isActive: true,
      },
      {
        email: "mesh@company.com",
        password: "mesh123",
        role: "Mesh Cutting",
        name: "Mesh Cutter",
        isActive: true,
      },
      {
        email: "quality@company.com",
        password: "quality123",
        role: "Quality",
        name: "Quality Control",
        isActive: true,
      },
    ];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const user = new User(userData);
        await user.save();
        console.log(`✓ Created user: ${userData.email}`);
      } else {
        console.log(`- User already exists: ${userData.email}`);
      }
    }

    console.log("\n✓ Seeding complete!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedUsers();
