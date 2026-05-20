import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // merchants.shansi.app → serve merchant register page
  if (host === "merchants.shansi.app" || host === "merchants.shansi.app:3000") {
    const url = request.nextUrl.clone();
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/merchant/register";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts).*)"],
};
