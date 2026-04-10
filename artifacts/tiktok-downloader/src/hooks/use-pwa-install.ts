import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// "unsupported" = initial (hidden), "ios" = iOS Safari, "ready" = Chrome auto-prompt,
// "manual" = browser can't auto-prompt but can show instructions, "installed" = done
export type InstallState = "unsupported" | "ios" | "ready" | "manual" | "installed";

export function usePwaInstall() {
  const [installState, setInstallState] = useState<InstallState>("unsupported");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker using the app's base URL so the scope is correct
    if ("serviceWorker" in navigator) {
      const base = import.meta.env.BASE_URL ?? "/";
      navigator.serviceWorker
        .register(`${base}sw.js`, { scope: base })
        .catch(() => {});
    }

    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isInstalled) {
      setInstallState("installed");
      return;
    }

    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(navigator as unknown as { standalone?: boolean }).standalone;

    if (isIos) {
      setInstallState("ios");
      return;
    }

    // Listen for Chrome/Edge's native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState("ready");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // If the browser never fires beforeinstallprompt within 3 seconds
    // (Firefox, Brave, Samsung Internet, etc.), fall back to manual instructions
    const fallbackTimer = setTimeout(() => {
      setInstallState((prev) =>
        prev === "unsupported" ? "manual" : prev
      );
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setInstallState("installed");
      return true;
    }
    return false;
  };

  const markInstalled = () => setInstallState("installed");

  return { installState, install, markInstalled };
}
