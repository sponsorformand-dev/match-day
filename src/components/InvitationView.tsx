import React, { useEffect } from 'react';

const UNGDOMSSPILLER_LINK =
  'https://drive.google.com/file/d/1M-PY-t4PF76H9qNXWezVBl3LOsxe_6i-/view?usp=sharing';

const SENIORSPILLER_LINK =
  'https://drive.google.com/file/d/1naQMGyAfqevgLH91n8Z9RZ9vXI_Y9sp5/view?usp=sharing';

export const InvitationView: React.FC = () => {
  useEffect(() => {
    document.title = 'AGF Håndbold – Dobbeltbrag i Arenaen';
    window.scrollTo(0, 0);
  }, []);

  const imageStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    maxWidth: 'none',
    height: 'auto',
    margin: 0,
    padding: 0,
    border: 0,
  };

  return (
    <div className="min-h-screen w-full bg-[#FBF8F1] flex flex-col items-center p-0">
      <div className="w-full max-w-[1184px] bg-[#FBF8F1]">
        <div className="w-full m-0 p-0 text-[0] leading-[0]">
          <img
            src="/agf-dobbeltbrag-del-1.png"
            alt="AGF Håndbold – Dobbeltbrag i Arenaen, del 1"
            style={imageStyle}
          />

          <img
            src="/agf-dobbeltbrag-del-2.png"
            alt="AGF Håndbold – Dobbeltbrag i Arenaen, del 2"
            style={imageStyle}
          />
        </div>

        <div className="w-full bg-[#12263F] text-white px-6 py-6">
          <div className="space-y-4">
            <div>
              <p className="font-bold">Ungdomsspiller</p>
              <a
                href={UNGDOMSSPILLER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-300 underline font-semibold"
              >
                Læs mere her
              </a>
            </div>

            <div>
              <p className="font-bold">Seniorspiller</p>
              <a
                href={SENIORSPILLER_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-300 underline font-semibold"
              >
                Læs mere her
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
