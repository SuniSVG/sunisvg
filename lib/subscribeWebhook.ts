// lib/subscribeWebhook.ts
// Chạy 1 lần khi deploy, và renew mỗi ~5 ngày (sub hết hạn sau 10 ngày)
import { PRIVATE_CHANNELS } from "./channels";

const HUB_URL     = "https://pubsubhubbub.appspot.com/subscribe";
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`;

export async function subscribeAllChannels() {
  const results = await Promise.allSettled(
    PRIVATE_CHANNELS.map(async (channel) => {
      const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel.id}`;

      const body = new URLSearchParams({
        "hub.callback":      WEBHOOK_URL,
        "hub.topic":         topicUrl,
        "hub.mode":          "subscribe",
        "hub.lease_seconds": "864000", // 10 ngày
        "hub.verify":        "async",
      });

      const res = await fetch(HUB_URL, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      console.log(`[Webhook] ${channel.subject}: ${res.status}`);
      return res.status;
    })
  );
  return results;
}