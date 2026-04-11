import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Redirect old domain to new one
  const host = request.headers.get("host") || "";
  if (host.includes("copa-omega-rho.vercel.app")) {
    const url = new URL(request.url);
    url.host = "bladers-sf.vercel.app";
    return NextResponse.redirect(url, 301);
  }

  try {
    return await updateSession(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
