import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "himalayan-lifeline-super-secret-key"
);

// Map roles to their allowed paths
const roleRedirects: Record<string, string> = {
  trekker: '/sos',
  guide: '/alerts',
  lodge_owner: '/alerts',
  villager: '/alerts',
  rescue_coordinator: '/dashboard',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect specific routes
  const protectedPaths = ['/sos', '/alerts', '/dashboard', '/history'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get('hl_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // Optional: Add stricter RBAC here if needed
    // For example, block trekkers from /alerts
    if (pathname.startsWith('/alerts') && role === 'trekker') {
      return NextResponse.redirect(new URL('/sos', request.url));
    }
    if (pathname.startsWith('/dashboard') && role !== 'rescue_coordinator') {
      return NextResponse.redirect(new URL(roleRedirects[role] || '/', request.url));
    }

    // Pass the payload info in headers for server components if needed
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id as string);
    response.headers.set('x-user-role', payload.role as string);
    response.headers.set('x-user-name', payload.name as string);
    return response;
  } catch (error) {
    // Invalid token
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/sos/:path*', '/alerts/:path*', '/dashboard/:path*', '/history/:path*'],
};
