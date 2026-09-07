import React, { useState } from 'react';
import { UserCheck, ExternalLink, ShieldCheck, AlertCircle, X, Maximize2 } from 'lucide-react';

interface LooadViewProps {
  looadUrl?: string;
  looadTitle?: string;
  looadDescription?: string;
}

export const LooadView: React.FC<LooadViewProps> = ({
  looadUrl = 'https://looad.dk/event/agf-matchday-2026',
  looadTitle = 'Tilmeld dig aktiviteten',
  looadDescription = 'Tilmeld dig her og vær med på dagen.',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleOpenExternal = () => {
    if (looadUrl) {
      window.open(looadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="pb-16 pt-2">
      {/* Header banner */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 mb-4 shadow-sm border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Looad Matchday Tilmelding</span>
        </div>
        <h2 className="text-2xl font-black font-['Teko'] uppercase tracking-tight text-white">
          Tilmelding
        </h2>
        <p className="text-xs text-gray-300">
          Tilmeld dig dagens lodtrækninger, pausekonkurrencer og aktiviteter direkte i appen.
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#081326] mx-auto flex items-center justify-center mb-4">
          <UserCheck className="w-8 h-8 text-[#081326]" />
        </div>

        <h3 className="text-xl font-extrabold text-[#081326]">
          {looadTitle}
        </h3>

        <p className="text-xs text-gray-600 mt-1.5 max-w-xs mx-auto leading-relaxed">
          {looadDescription}
        </p>

        <div className="my-5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Sikker tilmelding leveret af Looad</span>
        </div>

        <div className="space-y-2.5">
          <button
            id="looad-register-btn"
            onClick={() => {
              setIframeError(false);
              setIsModalOpen(true);
            }}
            className="w-full py-3.5 bg-[#081326] hover:bg-black text-white rounded-xl font-extrabold text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Tilmeld Dig</span>
            <UserCheck className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenExternal}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
          >
            <span>Åbn i separat fane</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col p-2 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl border border-gray-300">
            {/* Modal Header */}
            <div className="p-3.5 bg-[#081326] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider font-['Teko'] text-base">
                  Looad Tilmelding
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenExternal}
                  title="Åbn i nyt vindue"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Iframe with fallback */}
            <div className="flex-1 relative bg-gray-50">
              {iframeError ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                  <h4 className="text-base font-bold text-[#081326]">
                    Indlejring understøttes ikke af arrangementsiden
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm">
                    Sikkerhedsindstillinger hos Looad kræver at tilmeldingssiden åbnes i et separat vindue.
                  </p>
                  <button
                    onClick={handleOpenExternal}
                    className="mt-4 px-6 py-3 bg-[#081326] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md"
                  >
                    Åbn Looad i ny fane
                  </button>
                </div>
              ) : (
                <iframe
                  src={looadUrl}
                  title="Looad Tilmelding"
                  className="w-full h-full border-none"
                  onError={() => setIframeError(true)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
