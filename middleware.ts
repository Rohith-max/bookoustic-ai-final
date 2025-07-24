// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Allow all requests to proceed
  return NextResponse.next();
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    // Skip all static files (images, etc)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};