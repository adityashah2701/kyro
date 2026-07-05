import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/projects", "/settings"];
  const authRoutes = ["/login"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  let session = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    if (response.ok) {
      session = await response.json();
    }
  } catch (error) {
    console.error("Error fetching session in middleware", error);
  }

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
