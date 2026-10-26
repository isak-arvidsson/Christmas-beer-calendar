import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { BeerDay, CalendarRatings, GoogleSheetConfig } from '../types.ts';
import { exportCalendarToCsv, normalizeGoogleSheetCsvUrl } from '../utils/googleSheets.ts';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onSaveConfig: (newConfig: GoogleSheetConfig) => void;
  onTriggerSync: (customUrl?: string) => Promise<boolean>;
  beers: BeerDay[];
  ratings: CalendarRatings;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTriggerSync,
  beers,
  ratings,
}) => {
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const normalized = normalizeGoogleSheetCsvUrl(sheetUrl);
    onSaveConfig({
      sheetUrl: normalized,
      autoSync,
      syncStatus: 'syncing',
    });

    const ok = await onTriggerSync(normalized);
    setSyncing(false);
    if (ok) {
      setSyncMessage({
        type: 'success',
        text: 'Synkronisering slutförd! Kalenderdata och bilder uppdaterade från Google Sheets.',
      });
    } else {
      setSyncMessage({
        type: 'error',
        text: 'Kunde inte hämta kalkylarket. Kontrollera att det är "Publicerat på webben" som CSV och har offentlig åtkomst.',
      });
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = exportCalendarToCsv(beers, ratings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Julolskalendern_2026_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTemplate = () => {
    const csvContent = exportCalendarToCsv(beers, ratings);
    navigator.clipboard.writeText(csvContent);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#14201c] p-6 sm:p-8 border border-amber-950/60 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Stäng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-cinzel">Google Sheets Synkronisering</h2>
            <p className="text-xs text-slate-400">
              Synka ölnamn, bilder, länkar och betyg direkt med Google Drive.
            </p>
          </div>
        </div>

        {/* Feedback message banner */}
        {syncMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs mb-5 flex items-start gap-2.5 ${
              syncMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-950/40 text-red-300 border border-red-500/30'
            }`}
          >
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>{syncMessage.text}</div>
          </div>
        )}

        {/* URL Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
              Offentlig Google Sheet CSV-länk
            </label>
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tips: Du kan även klistra in en vanlig Google Kalkylarkslänk med visningsbehörighet.
            </p>
          </div>

          {/* Sync actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => {
                  setAutoSync(e.target.checked);
                  onSaveConfig({ ...config, autoSync: e.target.checked });
                }}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <span>Automatisk synkning vid appstart</span>
            </label>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synkroniserar...' : 'Synka nu'}</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions Toggle */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hur skapar jag en synkad Google Sheets-länk?</span>
          </button>

          {showInstructions && (
            <div className="mt-3 p-4 rounded-xl bg-slate-950/70 text-xs text-slate-300 space-y-2 border border-slate-800">
              <p className="font-semibold text-amber-300">Följ dessa 4 enkla steg i Google Drive:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>
                  Klicka på <strong className="text-slate-200">Kopiera CSV-mall</strong> nedan och klistra in den i ett tomt Google Sheet.
                </li>
                <li>
                  I kalkylarket, klicka på <strong className="text-slate-200">Arkiv &gt; Dela &gt; Publicera på webben</strong>.
                </li>
                <li>
                  Ändra format från "Webbsida" till <strong className="text-slate-200">Kommaavgränsade värden (.csv)</strong> och klicka på <strong className="text-slate-200">Publicera</strong>.
                </li>
                <li>Kopiera länken och klistra in den i rutan ovan!</li>
              </ol>
            </div>
          )}
        </div>

        {/* Export & Template Tools */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Exportera eller Skapa Kalkylark
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors"
            >
              {copiedTemplate ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Kopierat till urklipp!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Kopiera CSV för Google Sheet</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Ladda ner CSV-fil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
