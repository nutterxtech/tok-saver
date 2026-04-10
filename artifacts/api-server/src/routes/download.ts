import { Router, type IRouter } from "express";
import { db, downloadsTable, subscriptionsTable } from "@workspace/db";
import { eq, and, gt, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { DownloadVideoBody } from "@workspace/api-zod";
import { fetchTikTokVideo } from "../lib/tiktok";
import { getSetting } from "../lib/settings";

const router: IRouter = Router();

router.post("/download", requireAuth, async (req, res): Promise<void> => {
  const parsed = DownloadVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { url } = parsed.data;

  if (!url.includes("tiktok.com") && !url.includes("vm.tiktok.com")) {
    res.status(400).json({ error: "Invalid TikTok URL" });
    return;
  }

  const userId = req.userId!;
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
      title: videoInfo.title,
      thumbnailUrl: videoInfo.thumbnailUrl,
      remainingFreeDownloads,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch TikTok video");
    res.status(422).json({ error: "Could not process TikTok URL. Please check the URL and try again." });
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

export default router;
