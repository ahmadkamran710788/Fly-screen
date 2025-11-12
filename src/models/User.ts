// src/models/User.ts
import mongoose, { Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

interface IUser {
  email: string;
  password: string;
  role: "Admin" | "Frame Cutting" | "Mesh Cutting" | "Quality";
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Frame Cutting", "Mesh Cutting", "Quality"],
    },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>("User", UserSchema);

export type User = IUser;
