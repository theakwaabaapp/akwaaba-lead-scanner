import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password: string };
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected || password === expected) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("akwaaba-auth", password, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
