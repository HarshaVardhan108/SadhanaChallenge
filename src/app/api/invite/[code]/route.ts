import { NextResponse } from "next/server";
import { findUserByInviteCode, inviteUrl } from "@/lib/invite";

type Ctx = { params: Promise<{ code: string }> };

/** GET /api/invite/:code — public inviter preview */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { code } = await ctx.params;
    const inviter = await findUserByInviteCode(decodeURIComponent(code));
    if (!inviter) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      inviter: {
        fullName: inviter.fullName,
        code: inviter.inviteCode,
      },
      url: inviteUrl(inviter.inviteCode),
    });
  } catch (e) {
    console.error("GET invite code", e);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
