import { Router, type IRouter, type Request, type Response } from "express";
import { db, downloadsTable, subscriptionsTable, usersTable } from "@workspace/db";
import { eq, and, gt, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { DownloadVideoBody } from "@workspace/api-zod";
import { fetchTikTokVideo } from "../lib/tiktok";
import { getSetting } from "../lib/settings";
import { Readable } from "node:stream";

const router: IRouter = Router();

router.post("/download", requireAuth, async (req, res): Promise<void> => {
  const parsed = DownloadVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { url } = parsed.data;

  if (!/tiktok\.com|vm\.tiktok\.com/i.test(url)) {
    res.status(400).json({ error: "Unsupported URL. Please paste a TikTok video link." });
    return;
  }

  const userId = req.userId!;

  const [currentUser] = await db
    .select({ emailVerified: usersTable.emailVerified })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!currentUser?.emailVerified) {
    res.status(403).json({ error: "Please verify your email address before downloading." });
    return;
  }

  const now = new Date();

  const [activeSub] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "active"),
        gt(subscriptionsTable.expiresAt, now)
      )
    );

  const freeLimit = Number(await getSetting("free_downloads_per_user"));
  const [downloadsResult] = await db
    .select({ count: count() })
    .from(downloadsTable)
    .where(eq(downloadsTable.userId, userId));
  const downloadsCount = Number(downloadsResult?.count ?? 0);

  if (!activeSub && downloadsCount >= freeLimit) {
    const subPrice = Number(await getSetting("subscription_price"));
    const currency = await getSetting("currency");
    res.status(402).json({
      error: "Free download quota exhausted. Please subscribe to continue.",
      subscriptionPrice: subPrice,
      currency,
    });
    return;
  }

  try {
    const videoInfo = await fetchTikTokVideo(url);

    await db.insert(downloadsTable).values({ userId, url });

    const remainingFreeDownloads = activeSub
      ? 999
      : Math.max(0, freeLimit - downloadsCount - 1);

    res.json({
      downloadUrl: videoInfo.downloadUrl,
      musicUrl: videoInfo.musicUrl,
      title: videoInfo.title,
      thumbnailUrl: videoInfo.thumbnailUrl,
      remainingFreeDownloads,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch TikTok video");
    res.status(422).json({ error: "Could not process this TikTok URL. Please check the link and try again." });
  }
});

router.get("/downloads/history", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const downloads = await db
    .select()
    .from(downloadsTable)
    .where(eq(downloadsTable.userId, userId))
    .orderBy(desc(downloadsTable.downloadedAt))
    .limit(50);

  res.json(
    downloads.map((d) => ({
      id: d.id,
      url: d.url,
      downloadedAt: d.downloadedAt,
    }))
  );
});

router.delete("/downloads/history", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  await db.delete(downloadsTable).where(eq(downloadsTable.userId, userId));
  res.json({ success: true });
});

const ALLOWED_CDN_HOSTS = [
  "tikcdn.io",
  "tikwm.com",
  "tiktokcdn.com",
  "tiktokcdn-eu.com",
  "tiktokcdn-us.com",
  "akamaized.net",
  "v19-webapp.tiktok.com",
  "v19.tiktokcdn.com",
];

router.get("/download-proxy", requireAuth, async (req, res): Promise<void> => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : null;
  const filename = typeof req.query.filename === "string" ? req.query.filename : "video.mp4";

  if (!rawUrl) {
    res.status(400).json({ error: "Missing url query parameter" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (parsed.protocol !== "https:") {
    res.status(400).json({ error: "Only HTTPS URLs are allowed" });
    return;
  }

  const hostname = parsed.hostname;
  const allowed = ALLOWED_CDN_HOSTS.some((h) => hostname === h || hostname.endsWith("." + h));
  if (!allowed) {
    res.status(400).json({ error: "URL host not allowed" });
    return;
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TokSaver/1.0)" },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "Failed to fetch video from source" });
      return;
    }

    const fileExt = filename.split(".").pop()?.toLowerCase();
    const upstreamType = (upstream.headers.get("content-type") || "").toLowerCase();

    // If the CDN is serving audio bytes for a video (.mp4) request, reject it
    // early — this is the root cause of "Save Video saves audio".
    if (fileExt === "mp4" && (upstreamType.startsWith("audio/") || upstreamType === "application/octet-stream" && upstreamType.includes("mpeg"))) {
      req.log.warn({ upstreamType, url: rawUrl.slice(0, 100) }, "Audio content-type returned for mp4 request — rejecting");
      res.status(415).json({ error: "The video file appears to contain only audio. This TikTok may be a slideshow or audio post." });
      return;
    }

    // Use exact MIME type based on extension; don't trust upstream headers
    const contentType =
      fileExt === "mp3" ? "audio/mpeg" :
      fileExt === "mp4" ? "video/mp4" :
      upstreamType || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    req.log.info({ fileExt, upstreamType, contentLength }, "Proxying file");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
      nodeStream.pipe(res);
      nodeStream.on("error", (err) => {
        req.log.error({ err }, "Proxy stream error");
        if (!res.headersSent) res.status(502).end();
      });
    } else {
      res.status(502).json({ error: "No body from source" });
    }
  } catch (err) {
    req.log.error({ err }, "download-proxy fetch error");
    res.status(502).json({ error: "Failed to proxy video" });
  }
});

export default router;
