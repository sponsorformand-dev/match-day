import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, ArrowLeft, Smartphone, ShieldCheck } from 'lucide-react';
import { Matchday } from '../types.ts';

interface ShareMatchdayViewProps {
  matchday?: Matchday;
  canonicalUrl?: string;
  onBack?: () => void;
}

export const ShareMatchdayView: React.FC<ShareMatchdayViewProps> = ({
  matchday,
  canonicalUrl,
  onBack,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [canShare, setCanShare] = useState<boolean>(false);

  // Determine the canonical public application URL
  // Must always point to main public application URL, not to the current subpage
  const shareTargetUrl =
    canonicalUrl ||
    matchday?.shareUrl ||
    (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? `${window.location.origin}${window.location.pathname.replace(/\/admin.*$/, '').replace(/\/scanner.*$/, '')}`
      : 'https://match-day-rose.vercel.app');

  useEffect(() => {
    // Generate high-resolution, high-contrast QR code
    QRCode.toDataURL(shareTargetUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#081326',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));

    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanShare(true);
    }
  }, [shareTargetUrl]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AGF Håndbold – Matchday',
          text: 'Følg AGF Håndbold live i hallen: kampprogram, afstemning om Kampens Spiller og eksklusive kiosktilbud!',
          url: shareTargetUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareTargetUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareTargetUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="pb-20 pt-2 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#081326] py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tilbage</span>
          </button>
        ) : (
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600">
            Fællesskab & Deling
          </div>
        )}
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Officiel Matchday URL</span>
        </div>
      </div>

      {/* Main Sharing Card - High Contrast, optimized for scanning off phone screen */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg text-center flex flex-col items-center">
        {/* AGF Club Crest Logo */}
        <div className="w-16 h-16 rounded-full bg-white border-2 border-red-600 flex items-center justify-center p-2 shadow-sm mb-3">
          <img
            src="/agf-logo.svg"
            alt="AGF Håndbold Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Headline & Subtitle per specification */}
        <h1 className="text-2xl font-black uppercase tracking-tight text-[#081326]">
          Del AGF Matchday
        </h1>
        <p className="text-sm font-semibold text-gray-600 mt-1 max-w-xs">
          Scan QR-koden og åbn Matchday på din telefon
        </p>

        {/* Big high-contrast QR Code with generous white isolation whitespace */}
        <div className="my-5 p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-md inline-block">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR-kode for AGF Matchday"
              className="w-64 h-64 max-w-[70vw] max-h-[70vw] object-contain rounded-lg mx-auto"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-gray-400 text-xs font-mono">
              Genererer QR-kode...
            </div>
          )}
        </div>

        {/* Scan instruction indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-600 mb-6 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
          <Smartphone className="w-4 h-4 text-red-600 animate-pulse" />
          <span>Hold telefonen mod koden for hurtig åbning</span>
        </div>

        {/* Action Buttons as requested */}
        <div className="w-full space-y-2.5">
          {/* DEL APPEN button (Web Share API) */}
          <button
            onClick={handleNativeShare}
            className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>DEL APPEN</span>
          </button>

          {/* KOPIÉR LINK button */}
          <button
            onClick={handleCopyLink}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white hover:bg-gray-50 text-[#081326] border-gray-300 shadow-xs'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Link kopieret ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>KOPIÉR LINK</span>
              </>
            )}
          </button>
        </div>

        {/* Target canonical link preview */}
        <div className="mt-4 pt-3 border-t border-gray-100 w-full text-center">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-600">
            Fast URL:
          </p>
          <p className="text-[11px] font-mono text-gray-700 truncate max-w-[280px] mx-auto mt-0.5">
            {shareTargetUrl}
          </p>
        </div>
      </div>
    </div>
  );
};
