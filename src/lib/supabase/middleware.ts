import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Helper to check if the path is a public route (login or auth)
  // Supports paths like /login, /en/login, /es/login, /auth/..., /en/auth/...
  const isPublicRoute = (pathname: string) => {
    return /^\/([a-z]{2}\/)?(login|auth)/.test(pathname);
  };

  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    // Try to preserve the current locale if present
    const localeMatch = request.nextUrl.pathname.match(/^\/([a-z]{2})/);
    const locale = localeMatch ? localeMatch[1] : "en";
    
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
