import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

const locales = ["en", "es"];
const defaultLocale = "en";

function getLocale(request: NextRequest) {
  // Check cookie first
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  const headers = { "accept-language": request.headers.get("accept-language") || "" };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if internal paths or static files (already mostly covered by config matcher)
  if (pathname.includes('/_next') || pathname.includes('/api') || pathname.includes('.')) {
      return await updateSession(request);
  }

  // Skip locale for auth callback to avoid issues with external providers
  if (pathname.startsWith('/auth/callback')) {
    return await updateSession(request);
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    // Redirect to localized path
    return NextResponse.redirect(request.nextUrl);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.webp|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

