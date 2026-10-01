import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getAdminPassword, setAdminCookie } from "../../../../lib/adminAuth";

export const dynamic = "force-dynamic";

function passwordsMatch(provided, expected) {
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) {
    const digest = createHmac("sha256", expected).update(provided).digest();
    const other = createHmac("sha256", expected).update(expected).digest();
    timingSafeEqual(digest, other);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(request) {
  const expected = getAdminPassword();
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD is not set. Add it to .env.local / Vercel env vars.",
      },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!passwordsMatch(body.password || "", expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminCookie(response);
  return response;
}
