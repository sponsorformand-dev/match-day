import React from 'react';
import { Partner } from '../types.ts';
import { HeartHandshake, ExternalLink, Sparkles, Tag } from 'lucide-react';

interface PartnersViewProps {
  partners: Partner[];
}

export const PartnersView: React.FC<PartnersViewProps> = ({ partners }) => {
  const activePartners = partners.filter((p) => p.active);

  // Group by category if desired
  const hovedPartnere = activePartners.filter((p) =>
    p.category.toLowerCase().includes('hoved')
  );
  const matchdayPartnere = activePartners.filter(
    (p) => !p.category.toLowerCase().includes('hoved')
  );

  return (
    <div className="pb-16 pt-2">
      {/* Header banner */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 mb-4 shadow-sm border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fællesskab & Erhvervsnetværk</span>
        </div>
        <h2 className="text-2xl font-black font-['Teko'] uppercase tracking-tight text-white">
          Dagens Partnere
        </h2>
        <p className="text-xs text-gray-300">
          En stor tak til de virksomheder og partnere der støtter AGF Håndbold og gør Matchday muligt.
        </p>
      </div>

      {activePartners.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-200">
          Ingen partnere tilføjet endnu.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Hovedpartnere */}
          {hovedPartnere.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 px-1">
                Hovedpartnere
              </h3>
              <div className="space-y-3">
                {hovedPartnere.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} isPremium />
                ))}
              </div>
            </div>
          )}

          {/* Matchday & Øvrige Partnere */}
          {matchdayPartnere.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 px-1">
                Matchday Partnere
              </h3>
              <div className="space-y-3">
                {matchdayPartnere.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Become a partner card */}
      <div className="mt-6 p-5 rounded-2xl bg-white border border-gray-200 text-center shadow-xs">
        <h4 className="font-extrabold text-sm text-[#081326]">
          Vil din virksomhed være partner i AGF Håndbold?
        </h4>
        <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
          Få eksponering foran hundredvis af engagerede tilskuere i Ceres Arena hver eneste hjemmekamp.
        </p>
        <a
          href="mailto:sponsorformand@agfhaandbold.dk"
          className="mt-3 inline-block px-4 py-2 bg-[#081326] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
        >
          Kontakt sponsorudvalget
        </a>
      </div>
    </div>
  );
};

const PartnerCard: React.FC<{ partner: Partner; isPremium?: boolean }> = ({
  partner,
  isPremium,
}) => {
  return (
    <div
      id={`partner-card-${partner.id}`}
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isPremium
          ? 'bg-white border-gray-300 shadow-sm'
          : 'bg-white border-gray-200 shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#F6F6F4] p-1.5 flex items-center justify-center flex-shrink-0 border border-gray-200">
            <img
              src={partner.logo || '/agf-logo.svg'}
              alt={partner.name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-base text-[#081326] leading-tight">
                {partner.name}
              </h4>
              {isPremium && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Hovedpartner
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              {partner.category}
            </span>
          </div>
        </div>

        {partner.websiteUrl && (
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-[#081326] transition-colors"
            title="Besøg hjemmeside"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {partner.message && (
        <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
          {partner.message}
        </p>
      )}

      {partner.offer && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2 text-xs text-[#C8102E] font-semibold">
          <Tag className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{partner.offer}</span>
        </div>
      )}
    </div>
  );
};
