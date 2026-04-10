import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_SETTINGS: Record<string, string> = {
  subscription_price: "49",
  currency: "KES",
  paylor_api_key: "",
  paylor_api_url: "https://paylor.webnixke.com/",
  admin_key: "admin123",
  free_downloads_per_user: "1",
};

export async function getSetting(key: string): Promise<string> {
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key));
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(appSettingsTable);
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}
