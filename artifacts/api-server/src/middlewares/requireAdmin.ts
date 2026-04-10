import { Request, Response, NextFunction } from "express";
import { getSetting } from "../lib/settings";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const adminKey = req.headers["x-admin-key"] as string | undefined;
  if (!adminKey) {
    res.status(401).json({ error: "Admin key required" });
    return;
  }
  const storedKey = await getSetting("admin_key");
  if (adminKey !== storedKey) {
    res.status(401).json({ error: "Invalid admin key" });
    return;
  }
  next();
}
