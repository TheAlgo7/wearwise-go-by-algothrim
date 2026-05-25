'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { OneUIButton } from './oneui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!prompt || dismissed) return null;

  const install = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setPrompt(null);
    else setDismissed(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 inset-x-4 z-50 flex items-center gap-3 bg-ink-200 border border-ink-400 rounded-oneui px-4 py-3 shadow-xl animate-slide-up"
    >
      <Download size={18} className="text-teal-400 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm text-fog-200 leading-snug">
        Install WearWise Go for offline access
      </p>
      <OneUIButton size="sm" onClick={install}>Install</OneUIButton>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss install prompt"
        className="p-1 text-fog-500 hover:text-fog-200 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
