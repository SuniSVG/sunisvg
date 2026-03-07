// app/api/gas/[action]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { gasQuery } from "@/lib/gasService"; // ← bỏ gasInvalidate
import { GAS_ACTIONS, GASAction } from "@/lib/gasClient";

// GET → query có cache
export async function GET(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  const action = params.action as GASAction;

  if (!(action in GAS_ACTIONS)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
  const forceRefresh = searchParams._refresh === "1";
  delete searchParams._refresh;

  try {
    const data = await gasQuery(action, searchParams, { forceRefresh });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "GAS unavailable" }, { status: 503 });
  }
}

// POST → gasQuery tự lo invalidate qua INVALIDATE_MAP trong gasService.ts
export async function POST(
  req: NextRequest,
  { params }: { params: { action: string } }
) {
  const action = params.action as GASAction;

  if (!(action in GAS_ACTIONS)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const body = await req.json();

  try {
    const data = await gasQuery(action, body);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "GAS unavailable" }, { status: 503 });
  }
}