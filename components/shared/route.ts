import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    try {
        // Server-side fetch — không bị CORS
        const res = await fetch(decodeURIComponent(url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; bot)',
                'Referer': 'https://toanmath.com/',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });

        const buffer = await res.arrayBuffer();

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch {
        return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
    }
}