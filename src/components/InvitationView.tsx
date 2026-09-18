import React, { useEffect } from 'react';

// Google Drive links fra invitationen (kan nemt tilpasses med de specifikke Google Drive URLs)
const UNGDOMSSPILLER_LINK = 'https://drive.google.com/drive/folders/agf-ungdomsspiller';
const SENIORSPILLER_LINK = 'https://drive.google.com/drive/folders/agf-seniorspiller';

export const InvitationView: React.FC = () => {
  useEffect(() => {
    document.title = 'AGF Håndbold – Dobbeltbrag i Arenaen';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#12263F] flex flex-col items-center justify-start p-0 sm:py-8 sm:px-4">
      <div className="w-full max-w-[800px] flex flex-col items-center justify-center bg-[#12263F] shadow-2xl">
        <img
          src="/agf-dobbeltbrag.png"
          alt="AGF Håndbold – Dobbeltbrag i Arenaen"
          className="invitation-image"
        />

        {/* Links fra invitationen */}
        <div id="invitation-links-area" className="w-full bg-[#12263F] text-white px-6 py-6 border-t border-white/10">
          <h2 className="text-lg font-bold text-white mb-4 tracking-wide">
            Links fra invitationen
          </h2>

          <div className="space-y-4">
            <div>
              <p className="font-bold text-slate-100 text-base">Ungdomsspiller</p>
              <div className="mt-1">
                <a
                  id="link-ungdomsspiller"
                  href={UNGDOMSSPILLER_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:text-sky-100 underline font-semibold text-sm sm:text-base transition-colors inline-block"
                >
                  Læs mere her
                </a>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-100 text-base">Seniorspiller</p>
              <div className="mt-1">
                <a
                  id="link-seniorspiller"
                  href={SENIORSPILLER_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-300 hover:text-sky-100 underline font-semibold text-sm sm:text-base transition-colors inline-block"
                >
                  Læs mere her
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

