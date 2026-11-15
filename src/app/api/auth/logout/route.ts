import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authAdapter, SESSION_COOKIE_NAME } from "@/lib/auth/adapter";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    await authAdapter.logout();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
