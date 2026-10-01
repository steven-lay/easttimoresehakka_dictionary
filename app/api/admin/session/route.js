import { NextResponse } from "next/server";
import { getAdminPassword, isAdminRequest } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!getAdminPassword()) {
    return NextResponse.json(
      { authenticated: false, configured: false },
      { status: 200 },
    );
  }

  return NextResponse.json({
    authenticated: isAdminRequest(request),
    configured: true,
  });
}
