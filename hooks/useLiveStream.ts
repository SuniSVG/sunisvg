/**
 * File: hooks/useLiveStream.ts
 * Mục đích: Hook để polling trạng thái livestream từ API nội bộ.
 */

import { useEffect, useState, useRef } from "react";

export interface LiveVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  startedAt: string;
}

export function useLiveStreams() {
  const [lives, setLives] = useState<LiveVideo[]>([]);
  const [connected, setConnected] = useState(false);
  const retryCount = useRef(0);
  const pollTimer = useRef<any>(null);

  useEffect(() => {
    let es: EventSource | undefined;

    function connect() {
      es = new EventSource("/api/live-events");

      es.onopen = () => {
        setConnected(true);
        retryCount.current = 0;
        // Có SSE rồi → không cần poll nữa
        if (pollTimer.current) clearInterval(pollTimer.current);
      };

      es.onmessage = (event) => {
        try {
          const { type, lives } = JSON.parse(event.data);
          if (type === "live_update") setLives(lives);
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es?.close();

        // Fallback sang polling nếu SSE thất bại
        startPolling();

        // Reconnect với exponential backoff
        const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
        retryCount.current++;
        setTimeout(connect, delay);
      };
    }

    function startPolling() {
      if (pollTimer.current) return; // đã poll rồi
      const poll = async () => {
        try {
          const res = await fetch("/api/live-check");
          const data = await res.json();
          if (data?.lives) setLives(data.lives);
        } catch (e) {
          console.error(e);
        }
      };
      poll();
      pollTimer.current = setInterval(poll, 60_000);
    }

    connect();

    return () => {
      es?.close();
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  return { lives, connected };
}
