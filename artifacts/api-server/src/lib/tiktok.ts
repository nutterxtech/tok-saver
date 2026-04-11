import { logger } from "./logger";

interface TikTokInfo {
  downloadUrl: string;
  musicUrl: string | null;
  title: string | null;
  thumbnailUrl: string | null;
}

export async function fetchTikTokVideo(url: string): Promise<TikTokInfo> {
  const cleanUrl = url.split("?")[0];

  const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`;
  logger.info({ url: cleanUrl }, "Fetching TikTok video info");

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`TikTok API request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    code: number;
    msg: string;
    data?: {
      play?: string;
      hdplay?: string;
      wmplay?: string;
      music?: string;
      music_info?: { play?: string };
      title?: string;
      cover?: string;
      images?: string[];
    };
  };

  if (data.code !== 0 || !data.data) {
    throw new Error(data.msg || "Failed to fetch video");
  }

  const videoData = data.data;

  // Photo slideshows have images[] but no playable video
  if (videoData.images?.length && !videoData.hdplay && !videoData.play) {
    throw new Error("This TikTok is a photo slideshow — only regular videos can be downloaded.");
  }

  const downloadUrl = videoData.hdplay || videoData.play || "";
  if (!downloadUrl) {
    throw new Error("No download URL available for this video.");
  }

  const musicUrl = videoData.music || videoData.music_info?.play || null;

  // Helper: extract just the hostname for safe logging
  function host(u?: string | null) {
    if (!u) return null;
    try { return new URL(u).hostname; } catch { return "invalid"; }
  }

  logger.info({
    downloadUrlHost: host(downloadUrl),
    musicUrlHost: host(musicUrl),
    hdplay: videoData.hdplay ? "present" : "missing",
    play: videoData.play ? "present" : "missing",
    isSlideshow: !!videoData.images?.length,
  }, "TikTok video data fields");

  // Guard: if video URL is the same as music URL, the API gave us audio instead of video
  if (downloadUrl === musicUrl) {
    logger.warn({ downloadUrlHost: host(downloadUrl) }, "downloadUrl same as musicUrl — audio-only or slideshow");
    throw new Error("Could not retrieve a video file for this TikTok. It may be a slideshow or audio-only post.");
  }

  // Guard: if the video CDN hostname looks like a music CDN, reject it
  const dlHost = host(downloadUrl) ?? "";
  if (dlHost.includes("music") || dlHost.includes("-ies-")) {
    logger.warn({ downloadUrlHost: dlHost }, "downloadUrl points to music CDN — rejecting as audio");
    throw new Error("This TikTok appears to be audio-only or a slideshow and cannot be downloaded as video.");
  }

  return {
    downloadUrl,
    musicUrl: musicUrl || null,
    title: videoData.title ?? null,
    thumbnailUrl: videoData.cover ?? null,
  };
}
