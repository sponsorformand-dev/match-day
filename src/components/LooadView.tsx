import React from 'react';
import { Zap, ExternalLink, ShieldCheck, HeartHandshake, ArrowLeft } from 'lucide-react';

interface LooadViewProps {
  looadUrl?: string;
  looadTitle?: string;
  looadDescription?: string;
  onBack?: () => void;
}

export const LooadView: React.FC<LooadViewProps> = ({
  looadUrl = 'https://looad.dk/pages/klub-agf-haandbold',
  looadTitle = 'STØT AGF HÅNDBOLD MED LOOAD',
  looadDescription = 'Skift elselskab til Looad og støt samtidig AGF Håndbold.',
  onBack,
}) => {
  const targetUrl = looadUrl || 'https://looad.dk/pages/klub-agf-haandbold';

  return (
    <div className="pb-20 pt-2 max-w-lg mx-auto w-full animate-fade-in">
      {/* Optional back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#081326] mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tilbage</span>
        </button>
      )}

      {/* Main Support Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm text-center relative overflow-hidden">
        {/* Official Looad Logo */}
        <div className="h-16 flex items-center justify-center mb-4">
          <div className="bg-gray-50/80 px-5 py-2.5 rounded-2xl border border-gray-200/80 inline-flex items-center justify-center shadow-2xs">
            <img
              src="/partners/looad.png"
              alt="Looad"
              className="max-h-8 max-w-[150px] w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-2.5">
          <Zap className="w-3 h-3 text-amber-600 fill-current" />
          <span>Officiel Energipartner</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#081326] leading-tight max-w-sm mx-auto">
          {looadTitle || 'STØT AGF HÅNDBOLD MED LOOAD'}
        </h2>

        <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
          {looadDescription || 'Skift elselskab til Looad og støt samtidig AGF Håndbold.'}
        </p>

        {/* Primary Action Button - Opens Directly in New Tab */}
        <div className="mt-6 space-y-3">
          <a
            id="looad-support-btn"
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-[#081326] hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>STØT KLUBBEN</span>
            <ExternalLink className="w-4 h-4 text-amber-400" />
          </a>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Åbner looad.dk i et nyt vindue</span>
          </div>
        </div>
      </div>

      {/* Partner Recognition Notice */}
      <div className="mt-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3 text-xs text-gray-600">
        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center p-2 flex-shrink-0">
          <HeartHandshake className="w-5 h-5 text-[#081326]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[#081326] text-xs">Stolt samarbejde med Looad</div>
          <div className="text-[11px] text-gray-500">Støt klubben ved at vælge Looad som din elleverandør.</div>
        </div>
      </div>
    </div>
  );
};
