import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const faviconPath = join(process.cwd(), 'bookicon.ico');
    const favicon = readFileSync(faviconPath);
    
    return new NextResponse(favicon, {
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    // Fallback to public folder
    try {
      const fallbackPath = join(process.cwd(), 'public', 'favicon.ico');
      const favicon = readFileSync(fallbackPath);
      return new NextResponse(favicon, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch {
      return new NextResponse('Favicon not found', { status: 404 });
    }
  }
}
