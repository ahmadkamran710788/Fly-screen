"use server";
import { cookies } from "next/headers";

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // Use token...
  return token;
}
