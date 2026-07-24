import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  appBaseUrl,
  countInvitesAccepted,
  ensureUserInviteCode,
  inviteUrl,
  listRecentInvitees,
} from "@/lib/invite";

/** GET /api/invite — current user's invite link + stats */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const code = await ensureUserInviteCode(session.id);
    const url = inviteUrl(code);
    const joined = await countInvitesAccepted(session.id);
    const recent = await listRecentInvitees(session.id, 8);
    // Simple points model: 50 per successful join
    const points = joined * 50;

    return NextResponse.json({
      ok: true,
      code,
      url,
      baseUrl: appBaseUrl(),
      joined,
      points,
      recent,
      shareText: `Hare Krishna! Join me on Bhakti Challenge — daily sadhana together.\n${url}`,
    });
  } catch (e) {
    console.error("GET /api/invite", e);
    return NextResponse.json(
      { error: "Failed to load invite link." },
      { status: 500 }
    );
  }
}
