import { NextRequest, NextResponse } from "next/server";
import { authAdapter } from "@/lib/auth/adapter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body || {};

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required." }, { status: 400 });
    }

    const result = await authAdapter.sendOtp(phone);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
