import { NextRequest, NextResponse } from 'next/server';

// Simple proxy to fetch images and bypass CORS / encoding issues.
// Only allows URLs from the project's Supabase storage bucket for security.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Basic whitelist: only allow Supabase public assets URLs
  const allowedDomain = 'supabase.co';
  try {
    const parsed = new URL(imageUrl);
    if (!parsed.hostname.endsWith(allowedDomain) && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'images.unsplash.com') {
      return new NextResponse('Forbidden domain', { status: 403 });
    }
    
    const response = await fetch(parsed.href);
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }
    
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400', // cache 1 day
      },
    });
  } catch (err) {
    console.error('Proxy image error', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
