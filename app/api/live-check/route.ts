// app/api/webhook/route.ts
// YouTube sẽ POST vào đây khi có video mới / live bắt đầu
import { NextRequest, NextResponse } from "next/server";
import { refreshAllLives } from "@/lib/liveService";

// YouTube verify bằng GET khi đăng ký subscription
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("hub.challenge");
  const mode      = searchParams.get("hub.mode");

  if (mode === "subscribe" && challenge) {
    // Trả lại challenge để xác nhận subscription
    return new Response(challenge, { status: 200 });
  }
  return new Response("Bad Request", { status: 400 });
}

// YouTube POST XML khi có sự kiện
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Parse XML để lấy channelId (đơn giản)
    // Khi có sự kiện mới → trigger refresh toàn bộ
    if (body.includes("<yt:videoId>") || body.includes("live")) {
      // Không cần parse sâu — cứ nhận được signal là refresh
      await refreshAllLives();
    }

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Error", { status: 500 });
  }
}