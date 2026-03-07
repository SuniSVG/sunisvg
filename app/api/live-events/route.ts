// app/api/live-events/route.ts
import { NextRequest } from "next/server";
import { addSSEClient, removeSSEClient, getLivesFromCache } from "@/lib/liveService";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // SSE cần nodejs runtime

export async function GET(req: NextRequest) {
  const clientId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(`data: ${data}\n\n`);
      };

      // Gửi state hiện tại ngay khi connect
      const current = await getLivesFromCache();
      send(JSON.stringify({ type: "live_update", lives: current }));

      // Đăng ký nhận update
      addSSEClient({ id: clientId, send });

      // Heartbeat mỗi 30s để giữ kết nối
      const heartbeat = setInterval(() => {
        try { controller.enqueue(": heartbeat\n\n"); }
        catch { clearInterval(heartbeat); }
      }, 30_000);

      // Cleanup khi client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeSSEClient(clientId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // quan trọng nếu dùng Nginx
    },
  });
}