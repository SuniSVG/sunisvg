// app/api/subscribe/route.ts
// Gọi 1 lần: POST /api/subscribe (bảo vệ bằng secret)
import { NextRequest, NextResponse } from "next/server";
import { subscribeAllChannels } from "@/lib/subscribeWebhook";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await subscribeAllChannels();
  return NextResponse.json({ results });
}