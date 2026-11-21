import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __BS_DEFERRED_PWA_PROMPT__?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__BS_DEFERRED_PWA_PROMPT__) {
      return window.__BS_DEFERRED_PWA_PROMPT__;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    const ua = navigator.userAgent || '';
    const ios =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);
    setIsAndroid(/Android/i.test(ua));

    if (window.__BS_DEFERRED_PWA_PROMPT__) {
      setDeferredPrompt(window.__BS_DEFERRED_PWA_PROMPT__);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__BS_DEFERRED_PWA_PROMPT__ = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__BS_DEFERRED_PWA_PROMPT__ = null;
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.__BS_DEFERRED_PWA_PROMPT__ = null;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    const activePrompt = deferredPrompt || window.__BS_DEFERRED_PWA_PROMPT__;
    if (!activePrompt) return false;
    await activePrompt.prompt();
    const { outcome } = await activePrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    window.__BS_DEFERRED_PWA_PROMPT__ = null;
    return outcome === 'accepted';
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
  };
}
