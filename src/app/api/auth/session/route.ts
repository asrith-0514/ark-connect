import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/adapter";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionVal) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = decodeSessionToken(sessionVal);
    if (!user) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null, error: String(error) }, { status: 500 });
  }
}
