import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Add it to your .env.local");
}

let cached = (global as any).mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // Optimized connection settings for Vercel serverless
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB || "flyscreen",
      maxPoolSize: 10, // Limit connections for serverless
      minPoolSize: 1,
      maxIdleTimeMS: 10000, // Close idle connections after 10s
      serverSelectionTimeoutMS: 8000, // 8 second timeout
      socketTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}


