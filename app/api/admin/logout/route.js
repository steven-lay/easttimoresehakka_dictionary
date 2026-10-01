import { NextResponse } from "next/server";
import { clearAdminCookie } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
