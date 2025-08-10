
import { NextResponse } from 'next/server';

// This route acts as a secure bridge between our frontend and the ASP.NET Core backend.
// It receives the authorization code from the client and forwards it to the backend.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is missing.' }, { status: 400 });
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('API base URL is not configured.');
    }
    
    // Forward the code to your ASP.NET Core API backend
    // The backend will handle the logic to exchange the code for an ID token
    const apiRes = await fetch(`${apiBaseUrl}/api/auth/apple/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      // The ASP.NET Core controller expects form data, so we build it here
      body: new URLSearchParams({ code }),
    });

    const result = await apiRes.json();

    if (!apiRes.ok) {
        // Forward the error from the backend
        return NextResponse.json({ error: 'Backend authentication failed', details: result.details || result.error || 'Unknown backend error' }, { status: apiRes.status });
    }

    // Return the successful response from the backend (containing session tokens, etc.) to the frontend
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[APPLE BRIDGE ERROR]', err);
    return NextResponse.json({ error: "Bridge Error", details: err.message }, { status: 500 });
  }
}
