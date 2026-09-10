import React, { useState } from 'react';
import { Partner, SponsorCategory } from '../types.ts';
import { HeartHandshake, ExternalLink, Tag, ShieldCheck, Mail } from 'lucide-react';

interface PartnersViewProps {
  partners: Partner[];
}

const CATEGORY_ORDER: SponsorCategory[] = [
  'HOVEDSPONSOR',
  'AGF PLAY',
  'AGF MATCH',
  'AGF FORDEL',
  'ØVRIGE MATCHDAY-PARTNERE',
];

interface CategoryMeta {
  title: string;
  badge: string;
  badgeClass: string;
  description?: string;
}

const CATEGORY_META: Record<SponsorCategory, CategoryMeta> = {
  HOVEDSPONSOR: {
    title: 'Hovedsponsor',
    badge: 'Klubbens Hovedsponsor',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Vores primære samarbejdspartner med størst engagement i AGF Håndbold.',
  },
  'AGF PLAY': {
    title: 'AGF Play',
    badge: 'Play Partner',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
  },
  'AGF MATCH': {
    title: 'AGF Match',
    badge: 'Match Partner',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  'AGF FORDEL': {
    title: 'AGF Fordel',
    badge: 'Fordelspartner',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  'ØVRIGE MATCHDAY-PARTNERE': {
    title: 'Øvrige Matchday-partnere',
    badge: 'Matchday Partner',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    description: 'Særlige kampdags- og samarbejdspartnere i Ceres Arena.',
  },
};

export const PartnersView: React.FC<PartnersViewProps> = ({ partners }) => {
  const activePartners = (partners || []).filter((p) => p.active !== false);

  // Group partners strictly by the 5 hierarchical categories
  const getPartnersByCategory = (category: SponsorCategory) => {
    return activePartners
      .filter((p) => {
        const cat = (p.category || p.sponsorCategory || '').toUpperCase().trim();
        if (category === 'HOVEDSPONSOR') {
          return cat === 'HOVEDSPONSOR' || cat.includes('HOVED');
        }
        if (category === 'AGF PLAY') {
          return cat === 'AGF PLAY' || cat === 'PLAY';
        }
        if (category === 'AGF MATCH') {
          return cat === 'AGF MATCH' || cat === 'MATCH';
        }
        if (category === 'AGF FORDEL') {
          return cat === 'AGF FORDEL' || cat === 'FORDEL';
        }
        if (category === 'ØVRIGE MATCHDAY-PARTNERE') {
          return (
            cat === 'ØVRIGE MATCHDAY-PARTNERE' ||
            cat === 'OVRIGE MATCHDAY-PARTNERE' ||
            cat.includes('ØVRIG') ||
            cat.includes('ENERGIPARTNER') ||
            cat.includes('MATCHDAY')
          );
        }
        return false;
      })
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  };

  const hovedsponsorList = getPartnersByCategory('HOVEDSPONSOR');
  const playList = getPartnersByCategory('AGF PLAY');
  const matchList = getPartnersByCategory('AGF MATCH');
  const fordelList = getPartnersByCategory('AGF FORDEL');
  const ovrigeList = getPartnersByCategory('ØVRIGE MATCHDAY-PARTNERE');

  return (
    <div className="pb-16 pt-2">
      {/* Top Header Banner */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 mb-5 shadow-sm border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
          <HeartHandshake className="w-4 h-4 text-emerald-400" />
          <span>AGF Håndbold · Erhvervsnetværk</span>
        </div>
        <h2 className="text-3xl font-black font-['Teko'] uppercase tracking-tight text-white leading-tight">
          VORES PARTNERE
        </h2>
        <p className="text-xs text-gray-300 mt-1 max-w-lg leading-relaxed">
          Tak til de virksomheder, der er med til at gøre AGF Håndbold og vores kampdage mulige.
        </p>
      </div>

      {activePartners.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
          Ingen partnere tilføjet endnu.
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. HOVEDSPONSOR - Highest Visual Prominence */}
          {hovedsponsorList.length > 0 && (
            <section aria-labelledby="section-hovedsponsor">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 id="section-hovedsponsor" className="text-xs font-black uppercase tracking-wider text-gray-600">
                    Hovedsponsor
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                  Top Partner
                </span>
              </div>

              <div className="space-y-3">
                {hovedsponsorList.map((partner) => (
                  <HovedsponsorCard key={partner.id} partner={partner} />
                ))}
              </div>
            </section>
          )}

          {/* 2. AGF PLAY - Prominent 2/3 column logo presentation */}
          {playList.length > 0 && (
            <section aria-labelledby="section-agf-play">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h3 id="section-agf-play" className="text-xs font-black uppercase tracking-wider text-gray-600">
                    AGF Play
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">
                  {playList.length} {playList.length === 1 ? 'partner' : 'partnere'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {playList.map((partner) => (
                  <PartnerGridCard key={partner.id} partner={partner} size="large" />
                ))}
              </div>
            </section>
          )}

          {/* 3. AGF MATCH - Clean responsive logo grid */}
          {matchList.length > 0 && (
            <section aria-labelledby="section-agf-match">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <h3 id="section-agf-match" className="text-xs font-black uppercase tracking-wider text-gray-600">
                    AGF Match
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">
                  {matchList.length} {matchList.length === 1 ? 'partner' : 'partnere'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {matchList.map((partner) => (
                  <PartnerGridCard key={partner.id} partner={partner} size="medium" />
                ))}
              </div>
            </section>
          )}

          {/* 4. AGF FORDEL - Compact, clean responsive logo grid */}
          {fordelList.length > 0 && (
            <section aria-labelledby="section-agf-fordel">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  <h3 id="section-agf-fordel" className="text-xs font-black uppercase tracking-wider text-gray-600">
                    AGF Fordel
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">
                  {fordelList.length} {fordelList.length === 1 ? 'partner' : 'partnere'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {fordelList.map((partner) => (
                  <PartnerGridCard key={partner.id} partner={partner} size="compact" />
                ))}
              </div>
            </section>
          )}

          {/* 5. ØVRIGE MATCHDAY-PARTNERE - Campaign/event partners */}
          {ovrigeList.length > 0 && (
            <section aria-labelledby="section-ovrige-partnere">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <h3 id="section-ovrige-partnere" className="text-xs font-black uppercase tracking-wider text-gray-600">
                    Øvrige Matchday-partnere
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">
                  {ovrigeList.length} {ovrigeList.length === 1 ? 'partner' : 'partnere'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ovrigeList.map((partner) => (
                  <OvrigPartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Become a partner card */}
      <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-white border border-gray-200 text-center shadow-xs">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-[#081326]">
          <Mail className="w-5 h-5 text-[#081326]" />
        </div>
        <h4 className="font-extrabold text-base text-[#081326]">
          Vil din virksomhed være partner i AGF Håndbold?
        </h4>
        <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
          Få stærk eksponering og bliv en del af vores voksende erhvervsnetværk i Ceres Arena.
        </p>
        <a
          id="partner-contact-btn"
          href="mailto:sponsorformand@agfhaandbold.dk"
          className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#081326] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
        >
          <span>Kontakt sponsorudvalget</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </div>
  );
};

// Safe Image component that gracefully handles errors with text fallback
const SafePartnerLogo: React.FC<{
  src?: string;
  name: string;
  className?: string;
}> = ({ src, name, className = 'w-full h-full object-contain' }) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-gray-50 rounded-lg">
        <span className="text-xs font-black text-gray-500 tracking-wider font-mono">
          {initials || 'AGF'}
        </span>
        <span className="text-[9px] text-gray-400 font-medium line-clamp-1 mt-0.5">
          {name}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
};

// 1. HOVEDSPONSOR CARD - Large prominent presentation
const HovedsponsorCard: React.FC<{ partner: Partner }> = ({ partner }) => {
  const CardWrapper = partner.websiteUrl ? 'a' : 'div';
  const wrapperProps = partner.websiteUrl
    ? {
        href: partner.websiteUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};

  return (
    <CardWrapper
      {...wrapperProps}
      id={`partner-card-${partner.id}`}
      className={`group block bg-white rounded-2xl p-5 border border-amber-200/90 shadow-sm transition-all duration-200 relative overflow-hidden ${
        partner.websiteUrl ? 'hover:shadow-md hover:border-amber-400 cursor-pointer' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        {/* Logo Container - Large aspect-ratio preserving display */}
        <div className="w-full sm:w-44 h-24 sm:h-24 rounded-xl bg-white p-2.5 flex items-center justify-center flex-shrink-0 border border-gray-100 shadow-2xs">
          <SafePartnerLogo
            src={partner.logo || partner.logoUrl}
            name={partner.name}
            className="max-h-16 w-auto max-w-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h4 className="font-extrabold text-lg text-[#081326] group-hover:text-blue-950 transition-colors">
              {partner.name}
            </h4>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              Hovedsponsor
            </span>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
            {partner.shortDescription || partner.message || 'Stolt hovedsponsor for AGF Håndbold.'}
          </p>

          {partner.websiteUrl && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#081326] group-hover:text-blue-800 transition-colors">
              <span>Besøg hjemmeside</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

// 2, 3, 4. GRID CARD for AGF PLAY, MATCH, and FORDEL
const PartnerGridCard: React.FC<{
  partner: Partner;
  size: 'large' | 'medium' | 'compact';
}> = ({ partner, size }) => {
  const CardWrapper = partner.websiteUrl ? 'a' : 'div';
  const wrapperProps = partner.websiteUrl
    ? {
        href: partner.websiteUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};

  const heightClass =
    size === 'large' ? 'h-20 sm:h-22' : size === 'medium' ? 'h-16 sm:h-18' : 'h-14 sm:h-16';
  const logoMaxHeight =
    size === 'large' ? 'max-h-14' : size === 'medium' ? 'max-h-11' : 'max-h-9';

  return (
    <CardWrapper
      {...wrapperProps}
      id={`partner-card-${partner.id}`}
      className={`group flex flex-col justify-between bg-white rounded-xl p-3 sm:p-3.5 border border-gray-200/90 shadow-2xs transition-all duration-200 ${
        partner.websiteUrl ? 'hover:shadow-sm hover:border-gray-400 cursor-pointer' : ''
      }`}
    >
      {/* Logo container with generous whitespace */}
      <div className={`w-full ${heightClass} flex items-center justify-center p-1.5 mb-2`}>
        <SafePartnerLogo
          src={partner.logo || partner.logoUrl}
          name={partner.name}
          className={`${logoMaxHeight} w-auto max-w-full object-contain`}
        />
      </div>

      {/* Name and subtle link indicator */}
      <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1">
        <span className="font-bold text-xs text-[#081326] leading-tight line-clamp-1 group-hover:text-blue-900 transition-colors">
          {partner.name}
        </span>
        {partner.websiteUrl && (
          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#081326] flex-shrink-0 transition-colors" />
        )}
      </div>

      {/* Optional short description for larger cards if provided */}
      {size === 'large' && partner.shortDescription && (
        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
          {partner.shortDescription}
        </p>
      )}

      {/* Optional matchday offer */}
      {partner.offer && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-50 flex items-center gap-1 text-[10px] text-[#C8102E] font-medium line-clamp-1">
          <Tag className="w-2.5 h-2.5 flex-shrink-0" />
          <span>{partner.offer}</span>
        </div>
      )}
    </CardWrapper>
  );
};

// 5. ØVRIGE MATCHDAY-PARTNERE CARD
const OvrigPartnerCard: React.FC<{ partner: Partner }> = ({ partner }) => {
  const CardWrapper = partner.websiteUrl ? 'a' : 'div';
  const wrapperProps = partner.websiteUrl
    ? {
        href: partner.websiteUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {};

  return (
    <CardWrapper
      {...wrapperProps}
      id={`partner-card-${partner.id}`}
      className={`group bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs transition-all flex items-center gap-3 ${
        partner.websiteUrl ? 'hover:shadow-sm hover:border-gray-400 cursor-pointer' : ''
      }`}
    >
      <div className="w-12 h-12 rounded-lg bg-gray-50 p-1.5 flex items-center justify-center flex-shrink-0 border border-gray-200">
        <SafePartnerLogo
          src={partner.logo || partner.logoUrl}
          name={partner.name}
          className="max-h-9 w-auto max-w-full object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="font-bold text-xs text-[#081326] truncate group-hover:text-blue-900 transition-colors">
            {partner.name}
          </h4>
          {partner.websiteUrl && (
            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-[#081326] flex-shrink-0" />
          )}
        </div>
        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
          {partner.shortDescription || partner.message || 'Matchday partner i Ceres Arena.'}
        </p>
        {partner.offer && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#C8102E] font-medium truncate">
            <Tag className="w-2.5 h-2.5 flex-shrink-0" />
            <span>{partner.offer}</span>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};
