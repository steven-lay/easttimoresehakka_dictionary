import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function sessionToken() {
  const password = getAdminPassword();
  if (!password) return "";
  return createHmac("sha256", password).update("hakka-admin-session").digest("hex");
}

export function isAdminRequest(request) {
  const password = getAdminPassword();
  if (!password) return false;

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;

  const expected = sessionToken();
  try {
    const a = Buffer.from(cookie);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function setAdminCookie(response) {
  response.cookies.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearAdminCookie(response) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
