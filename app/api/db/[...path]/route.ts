import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await params);
}

export async function OPTIONS(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleRequest(req, await params);
}

async function handleRequest(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new NextResponse(JSON.stringify({ error: "Configuration Error", details: "NEXT_PUBLIC_SUPABASE_URL is missing on the server." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  const targetUrl = `${baseUrl}/${path}${searchParams ? `?${searchParams}` : ""}`;
  
  // Only forward explicitly allowed safe headers
  const headers = new Headers();
  const allowedHeaders = ['authorization', 'apikey', 'content-type', 'accept', 'prefer', 'profile-client', 'x-client-info'];
  
  for (const [key, value] of req.headers.entries()) {
    if (allowedHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  
  // Create fetch options
  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    fetchOptions.body = req.body;
    // @ts-ignore: Required by Node.js for streaming fetch bodies
    fetchOptions.duplex = "half";
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    
    // Fix CORS
    responseHeaders.set("access-control-allow-origin", "*");
    responseHeaders.set("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    responseHeaders.set("access-control-allow-headers", "*");
    
    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse(JSON.stringify({ error: "Proxy error", details: String(error) }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
