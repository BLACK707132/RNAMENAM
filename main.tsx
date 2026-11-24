import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker cleanly without forcing abrupt mid-boot reloads
try {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        registration.update().catch(() => {});
      }
    },
  });
} catch {
  // Ignore SW registration errors in restricted WebViews (e.g. Capacitor / private tabs)
}

// Signal to index.html boot watchdog that the JS bundle mounted cleanly
(window as unknown as { __BS_MOUNTED__?: boolean }).__BS_MOUNTED__ = true;
try {
  sessionStorage.removeItem('bs_boot_recover_v1');
  sessionStorage.removeItem('bs_boot_recover_v2');
} catch {
  // Ignore sessionStorage errors in restricted WebViews
}

// Auto-recover once if a dynamic Vite chunk fails to load after an update
window.addEventListener('vite:preloadError', () => {
  try {
    if (!sessionStorage.getItem('bs_chunk_reload_v1')) {
      sessionStorage.setItem('bs_chunk_reload_v1', '1');
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

interface BoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BLACK STANT] Runtime error:', error, info);
  }

  handleHardReload = async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window && caches.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Ignore cleanup errors
    }
    window.location.replace(`${window.location.pathname}?r=${Date.now()}`);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[#10151c] text-white p-6 text-center">
          <div className="font-display text-2xl font-black">
            BLACK <span className="text-[#ff6a1a]">STANT</span>
          </div>
          <p className="text-sm text-white/75 max-w-xs">
            Произошёл сбой при запуске. Нажми кнопку ниже — игра обновится и откроется без потери
            сохранения.
          </p>
          <button
            type="button"
            onClick={this.handleHardReload}
            className="h-12 px-6 rounded-xl bg-[#ff6a1a] hover:bg-[#ff7b33] text-white font-display font-bold text-base shadow-lg"
          >
            Перезапустить игру
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
