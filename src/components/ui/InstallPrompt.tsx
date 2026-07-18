import { useState, useEffect } from 'react';
import './InstallPrompt.css';

const DISMISSED_KEY = 'booktrovert_install_dismissed_at';
const COOLDOWN_DAYS = 14;

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    ('standalone' in navigator && (navigator as any).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function isDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISSED_KEY);
  if (!ts) return false;
  const daysSince = (Date.now() - parseInt(ts, 10)) / (1000 * 60 * 60 * 24);
  return daysSince < COOLDOWN_DAYS;
}

interface InstallPromptProps {
  /** Number of books the user has tagged — prompt only shows at >= 3 */
  taggedBookCount: number;
}

export default function InstallPrompt({ taggedBookCount }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Never show if already installed or dismissed recently
    if (isInStandaloneMode()) return;
    if (isDismissedRecently()) return;
    if (taggedBookCount < 3) return;

    if (isIOS()) {
      setShowIOS(true);
      return;
    }

    // Android/Chrome: capture the browser's native prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, [taggedBookCount]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowAndroid(false);
    setShowIOS(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowAndroid(false);
    }
    setDeferredPrompt(null);
  };

  if (showAndroid) {
    return (
      <div className="install-prompt install-prompt--android" role="banner" aria-label="Install Booktrovert">
        <div className="install-prompt__icon">📚</div>
        <div className="install-prompt__body">
          <p className="install-prompt__title">Add Booktrovert to your home screen</p>
          <p className="install-prompt__sub">Quick access, no browser bar.</p>
        </div>
        <div className="install-prompt__actions">
          <button
            className="install-prompt__btn install-prompt__btn--primary"
            onClick={handleInstall}
            id="install-prompt-android-btn"
          >
            Install
          </button>
          <button
            className="install-prompt__btn install-prompt__btn--ghost"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            id="install-prompt-dismiss-btn"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (showIOS) {
    return (
      <div className="install-prompt install-prompt--ios" role="banner" aria-label="Install Booktrovert on iOS">
        <div className="install-prompt__icon">📚</div>
        <div className="install-prompt__body">
          <p className="install-prompt__title">Add to your home screen</p>
          <ol className="install-prompt__steps">
            <li>Tap the <strong>Share</strong> icon <span className="install-prompt__share-icon">⎋</span> in Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> to confirm</li>
          </ol>
        </div>
        <button
          className="install-prompt__close"
          onClick={handleDismiss}
          aria-label="Close"
          id="install-prompt-ios-close-btn"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
