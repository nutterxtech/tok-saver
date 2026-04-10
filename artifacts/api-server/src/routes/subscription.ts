import { Router, type IRouter } from "express";
import { db, subscriptionsTable, downloadsTable, usersTable } from "@workspace/db";
import { eq, and, gt, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { SubscriptionCallbackBody } from "@workspace/api-zod";
import { getSetting } from "../lib/settings";

const router: IRouter = Router();

router.get("/subscription/status", requireAuth, async (req, res): Promise<void> => {
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

  const [downloadsResult] = await db
    .select({ count: count() })
    .from(downloadsTable)
    .where(eq(downloadsTable.userId, userId));

  const downloadsCount = Number(downloadsResult?.count ?? 0);
  const freeLimit = Number(await getSetting("free_downloads_per_user"));
  const subscriptionPrice = Number(await getSetting("subscription_price"));
  const currency = await getSetting("currency");

  res.json({
    isActive: !!activeSub,
    expiresAt: activeSub?.expiresAt ?? null,
    downloadsCount,
    remainingFreeDownloads: activeSub
      ? 999
      : Math.max(0, freeLimit - downloadsCount),
    subscriptionPrice,
    currency,
  });
});

router.post("/subscription/subscribe", requireAuth, async (req, res): Promise<void> => {
  const userId = req.userId!;
  const [user] = await db
    .select({ name: usersTable.name, email: usersTable.email, phone: usersTable.phone })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  const amount = Number(await getSetting("subscription_price"));
  const currency = await getSetting("currency");
  const paylorApiKey = await getSetting("paylor_api_key");
  const paylorApiUrl = await getSetting("paylor_api_url");

  if (!paylorApiKey || !paylorApiUrl) {
    res.status(500).json({ error: "Payment gateway not configured" });
    return;
  }

  const reference = `TKT-${userId}-${Date.now()}`;

  // Store a pending subscription record before contacting the gateway.
  // The callback handler will only activate subscriptions that have a
  // matching pending record, preventing unauthenticated callers from
  // manufacturing fake successful callbacks.
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await db.insert(subscriptionsTable).values({
    userId,
    status: "pending",
    amountPaid: String(amount),
    currency,
    paymentReference: reference,
    expiresAt,
  });

  try {
    const callbackUrl = `${process.env.APP_URL ?? ""}/api/subscription/callback`;
    const paymentPayload = {
      amount,
      currency,
      reference,
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      name: user?.name ?? "",
      callback_url: callbackUrl,
      description: "TikTok Downloader Monthly Subscription",
    };

    const paylorResponse = await fetch(`${paylorApiUrl}api/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paylorApiKey}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paylorResponse.ok) {
      const errorData = await paylorResponse.text();
      req.log.error({ status: paylorResponse.status, body: errorData }, "Paylor payment initiation failed");
      res.status(500).json({ error: "Payment initiation failed" });
      return;
    }

    const paylorData = (await paylorResponse.json()) as {
      payment_url?: string;
      url?: string;
    };

    const paymentUrl = paylorData.payment_url ?? paylorData.url ?? "";

    res.json({
      paymentUrl,
      reference,
      amount,
      currency,
    });
  } catch (err) {
    req.log.error({ err }, "Error contacting Paylor");
    res.status(500).json({ error: "Payment gateway error" });
  }
});

router.post("/subscription/callback", async (req, res): Promise<void> => {
  const parsed = SubscriptionCallbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid callback data" });
    return;
  }
  const { reference, status, amount } = parsed.data;

  req.log.info({ reference, status, amount }, "Paylor callback received");

  const SUCCESSFUL_STATUSES = new Set(["success", "completed", "paid"]);

  if (SUCCESSFUL_STATUSES.has(status)) {
    // Only activate subscriptions that were explicitly created as pending.
    // This prevents an attacker from crafting a fake reference and gaining
    // a subscription without payment.
    const [pendingSub] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.paymentReference, reference),
          eq(subscriptionsTable.status, "pending")
        )
      );

    if (!pendingSub) {
      req.log.warn({ reference }, "Callback received for unknown or already-processed reference");
      res.status(400).json({ error: "Unknown or already processed payment reference" });
      return;
    }

    await db
      .update(subscriptionsTable)
      .set({ status: "active" })
      .where(eq(subscriptionsTable.id, pendingSub.id));

    req.log.info({ userId: pendingSub.userId, reference }, "Subscription activated");
  }

  res.json({ message: "Callback processed" });
});

export default router;
