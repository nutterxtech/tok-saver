import { logger } from "./logger";

interface TikTokInfo {
  downloadUrl: string;
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
      title?: string;
      cover?: string;
    };
  };

  if (data.code !== 0 || !data.data) {
    throw new Error(data.msg || "Failed to fetch video");
  }

  const videoData = data.data;
  const downloadUrl = videoData.hdplay ?? videoData.play ?? "";
  if (!downloadUrl) {
    throw new Error("No download URL available");
  }

  return {
    downloadUrl,
    title: videoData.title ?? null,
    thumbnailUrl: videoData.cover ?? null,
  };
}
