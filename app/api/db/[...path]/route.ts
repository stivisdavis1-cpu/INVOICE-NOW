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
  
  const targetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;
  
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
    // Read the body as an ArrayBuffer to preserve binary data (e.g. image uploads)
    // reading as text() corrupts binary files!
    fetchOptions.body = await req.arrayBuffer();
  }

  const fs = require('fs');
  let bodyForLog = 'none';
  if (fetchOptions.body) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      // Only log first 100 chars if it's valid UTF-8
      bodyForLog = decoder.decode((fetchOptions.body as ArrayBuffer).slice(0, 100)).replace(/\n/g, ' ');
    } catch (e) {
      bodyForLog = '[Binary Data]';
    }
  }
  
  const logEntry = `${new Date().toISOString()} | ${req.method} ${targetUrl} | Body: ${bodyForLog}\n`;
  fs.appendFileSync('proxy.log', logEntry);

  try {
    const response = await fetch(targetUrl, fetchOptions);
    
    fs.appendFileSync('proxy.log', `Response: ${response.status}\n`);
    
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
