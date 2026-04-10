import { logger } from "./logger";

interface VideoInfo {
  downloadUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
}

// cobalt.tools — free, open-source, no API key required for basic use.
// Supports Instagram Reels, posts, Stories, and Facebook videos.
// API docs: https://github.com/imputnet/cobalt
const COBALT_API = "https://api.cobalt.tools/";

export async function fetchInstagramVideo(url: string): Promise<VideoInfo> {
  const cleanUrl = url.split("?")[0];
  logger.info({ url: cleanUrl }, "Fetching Instagram/Facebook video via cobalt");

  const res = await fetch(COBALT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({ url: cleanUrl }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`cobalt API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    status: string;
    url?: string;
    filename?: string;
    error?: { code?: string; context?: unknown };
  };

  logger.info({ status: data.status, url: data.url?.slice(0, 80) }, "cobalt response");

  if (data.status === "error") {
    const code = data.error?.code ?? "unknown";
    throw new Error(`cobalt error: ${code}`);
  }

  // "tunnel" → proxied through cobalt servers (no expiry issues)
  // "redirect" → direct CDN URL (may expire)
  // "picker" → multiple streams (take the first)
  if ((data.status === "tunnel" || data.status === "redirect") && data.url) {
    return {
      downloadUrl: data.url,
      title: data.filename ? data.filename.replace(/\.[^/.]+$/, "") : null,
      thumbnailUrl: null,
    };
  }

  throw new Error(`Unexpected cobalt response status: ${data.status}`);
}
