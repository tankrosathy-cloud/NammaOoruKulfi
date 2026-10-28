import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Share2, 
  Layers, 
  Sparkles,
  QrCode
} from 'lucide-react';
import QRCode from 'qrcode';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isAndroid, isIOS } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [installing, setInstalling] = useState(false);

  // App URL for live production/preview
  const appUrl = window.location.origin;
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Namma Ooru Kulfi Android App',
          text: 'Install the Namma Ooru Kulfi Android POS & Management App:',
          url: appUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error(err);
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Android App & APK
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">Install directly on Android or package into .apk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-sm">
          {/* Status Banner */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            isInstalled 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${isInstalled ? 'text-emerald-400' : 'text-cyan-400'}`} />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider">
                  {isInstalled ? 'Running as Installed App' : 'Mobile Web & WebAPK Ready'}
                </p>
                <p className="text-[11px] opacity-80">
                  {isInstalled 
                    ? 'The app is running in native standalone windowing mode.' 
                    : 'PWA Manifest & Service Worker are active for instant installation.'}
                </p>
              </div>
            </div>
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-md"
              >
                {installing ? 'Installing...' : '1-Tap Install'}
              </button>
            )}
          </div>

          {/* Option 1: Instant Native Install (WebAPK) */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-black">1</span>
                <span>Fastest: 1-Tap Android Install (WebAPK)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Google Chrome automatically builds and installs a real native APK directly onto any Android phone. No file download or sideloading security warning required!
            </p>

            {isInstallable ? (
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Smartphone className="w-4 h-4 text-slate-950" />
                <span>Tap Here to Install on this Device</span>
              </button>
            ) : (
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/80 space-y-2 text-xs">
                <p className="text-slate-400 font-medium">To install on an Android phone using Chrome:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Open this URL in <strong>Google Chrome</strong> on the phone.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> at the top right of Chrome.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                  <li>The app icon appears on your home screen & app drawer like any Play Store app!</li>
                </ol>
              </div>
            )}
          </div>

          {/* Option 2: Download Standalone .APK File (PWABuilder) */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-black">2</span>
                <span>Download Standalone .APK File (PWABuilder)</span>
              </div>
              <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                Offline APK
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generate an installable <code className="text-cyan-400 font-mono">.apk</code> binary package using Microsoft's official PWABuilder engine.
            </p>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/80 space-y-2 text-xs">
              <p className="text-slate-400 font-medium">3-step process to download the APK:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Click the button below to open <strong>PWABuilder</strong> with this app's URL.</li>
                <li>Under <strong>"Package for Stores"</strong>, click the <strong>"Android"</strong> card.</li>
                <li>Click <strong>"Generate" / "Download Package"</strong> to download your <code className="text-pink-400 font-mono">.apk</code> file!</li>
              </ol>
            </div>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 cursor-pointer transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Open PWABuilder to Download .APK</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Quick Share / Scan on Android Device */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row items-center gap-4">
            {qrCodeDataUrl ? (
              <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                <img src={qrCodeDataUrl} alt="App QR Code" className="w-28 h-28 object-contain" />
              </div>
            ) : null}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Scan with Android Phone</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Point any Android phone camera at the QR code to open and install the app instantly.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied URL!' : 'Copy Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
