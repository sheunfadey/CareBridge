import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // IMPORTANT: do not add logic between client creation and getUser(). A
  // failure to call getUser() can cause users to be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/trainer") ||
    pathname.startsWith("/onboarding");

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/trainer") ||
      pathname.startsWith("/onboarding"))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "is_super_admin, user_role_assignments!user_role_assignments_user_id_fkey(role_key)",
      )
      .eq("id", user.id)
      .maybeSingle();

    const roleKeys = (profile?.user_role_assignments ?? []).map(
      (assignment) => assignment.role_key,
    );
    const isTrainerAccount =
      !profile?.is_super_admin &&
      (roleKeys.includes("instructor") || roleKeys.includes("training_admin"));

    // The trainer workspace and the personal portals are separate products:
    // trainer accounts never enter /dashboard, and everyone else never enters
    // /trainer. Both directions are decided at the edge.
    if (isTrainerAccount && pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/trainer";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/trainer")) {
      if (!isTrainerAccount) {
        const url = request.nextUrl.clone();
        url.pathname = profile?.is_super_admin ? "/dashboard/admin" : "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (profile?.is_super_admin) {
      if (pathname === "/dashboard" || pathname.startsWith("/onboarding")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }

      const allowed =
        pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/academy") ||
        pathname.startsWith("/dashboard/overview") ||
        pathname.startsWith("/dashboard/notifications") ||
        pathname.startsWith("/dashboard/messages") ||
        pathname.startsWith("/dashboard/settings") ||
        pathname.startsWith("/dashboard/help") ||
        pathname === "/dashboard/reports" ||
        pathname.startsWith("/dashboard/reports/");

      if (!allowed) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
