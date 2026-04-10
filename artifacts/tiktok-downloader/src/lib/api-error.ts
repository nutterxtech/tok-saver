import { ApiError } from "@workspace/api-client-react";

export { ApiError };

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const data = error.data;
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as Record<string, unknown>).error === "string"
    ) {
      return (data as Record<string, string>).error;
    }
  }
  return fallback;
}
