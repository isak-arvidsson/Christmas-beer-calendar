import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIOSGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title="Installera Julölskalendern som app"
        className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 hover:border-amber-400/60 transition-all whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className={compact ? 'hidden sm:inline' : ''}>Installera</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Lägg till på hemskärmen (iOS)"
          className="flex items-center gap-1.5 rounded-xl bg-amber-500/15 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 hover:border-amber-400/60 transition-all whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className={compact ? 'hidden sm:inline' : ''}>Installera</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-dialog-title"
          >
            <div
              className="relative w-full max-w-sm rounded-3xl bg-[#14201c] p-6 border border-amber-950/60 shadow-2xl text-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Stäng"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/apple-touch-icon.png"
                  alt="Julölskalendern"
                  className="h-11 w-11 rounded-xl border border-amber-500/30 shadow-md"
                />
                <div>
                  <h2 id="ios-install-dialog-title" className="text-base font-bold text-white font-cinzel">
                    Installera på iPhone / iPad
                  </h2>
                  <p className="text-xs text-slate-400">Lägg till på hemskärmen</p>
                </div>
              </div>

              <ol className="space-y-3 text-sm text-slate-300 mb-6">
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                    1
                  </span>
                  <span className="leading-relaxed">
                    Tryck på <strong className="text-white inline-flex items-center gap-1">Dela <Share className="w-3.5 h-3.5 text-amber-400 inline" /></strong> i Safaris verktygsfält.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                    2
                  </span>
                  <span className="leading-relaxed">
                    Scrolla ned och tryck på <strong className="text-white inline-flex items-center gap-1">Lägg till på hemskärmen <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" /></strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                    3
                  </span>
                  <span className="leading-relaxed">
                    Tryck på <strong className="text-white">Lägg till</strong> uppe i hörnet.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Uppfattat
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
