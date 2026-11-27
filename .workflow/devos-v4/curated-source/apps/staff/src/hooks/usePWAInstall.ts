import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let earlyDeferredPrompt: BeforeInstallPromptEvent | null = null;
let earlyAppInstalled = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    earlyDeferredPrompt = event as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    earlyDeferredPrompt = null;
    earlyAppInstalled = true;
  });
}

function isIosSafariBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIos && isSafari;
}

function isRunningInstalledOrNative(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as {
    __ATTAIE_ANDROID_APP__?: boolean;
    AttaieBiometric?: unknown;
  };
  if (win.__ATTAIE_ANDROID_APP__ || win.AttaieBiometric) return true;
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true;
  return false;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => earlyDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(
    () => earlyAppInstalled || isRunningInstalledOrNative(),
  );

  useEffect(() => {
    if (earlyAppInstalled || isRunningInstalledOrNative()) {
      setIsInstalled(true);
      return;
    }

    if (earlyDeferredPrompt) {
      setDeferredPrompt(earlyDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      earlyDeferredPrompt = event as BeforeInstallPromptEvent;
      setDeferredPrompt(earlyDeferredPrompt);
    };

    const handleAppInstalled = () => {
      earlyDeferredPrompt = null;
      earlyAppInstalled = true;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const isIos = isIosSafariBrowser();

  const promptInstall = useCallback(async (): Promise<"installed" | "dismissed" | "ios" | "unavailable"> => {
    const promptEvent = deferredPrompt ?? earlyDeferredPrompt;
    if (!promptEvent) {
      return isIos ? "ios" : "unavailable";
    }
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    earlyDeferredPrompt = null;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      earlyAppInstalled = true;
      setIsInstalled(true);
      return "installed";
    }
    return "dismissed";
  }, [deferredPrompt, isIos]);

  return {
    canInstall: !isInstalled && (Boolean(deferredPrompt) || isIos),
    isIosInstall: !isInstalled && !deferredPrompt && isIos,
    isInstalled,
    promptInstall,
  };
}
