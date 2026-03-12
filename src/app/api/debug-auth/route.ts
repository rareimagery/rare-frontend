import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.CONSOLE_ADMIN_EMAIL;
  const pass = process.env.CONSOLE_ADMIN_PASSWORD;
  return NextResponse.json({
    CONSOLE_ADMIN_EMAIL_set: !!email,
    CONSOLE_ADMIN_EMAIL_value: email ?? "NOT SET",
    CONSOLE_ADMIN_PASSWORD_set: !!pass,
    CONSOLE_ADMIN_PASSWORD_length: pass?.length ?? 0,
    CONSOLE_ADMIN_PASSWORD_first3: pass?.substring(0, 3) ?? "N/A",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    DRUPAL_API_URL: process.env.DRUPAL_API_URL ?? "NOT SET",
  });
}
