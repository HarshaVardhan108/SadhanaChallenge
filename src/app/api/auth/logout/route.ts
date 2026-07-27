import { NextResponse } from "next/server";
import { AUTH_COOKIE, cookieOptions } from "@/lib/auth";

export async function POST() {
  const opts = await cookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: 0,
  });
  return res;
}
