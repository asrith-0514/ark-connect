import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authAdapter, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/adapter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body || {};

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: "Identifier and password are required." }, { status: 400 });
    }

    const result = await authAdapter.loginWithPassword(identifier, password);

    if (result.success && result.token) {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
