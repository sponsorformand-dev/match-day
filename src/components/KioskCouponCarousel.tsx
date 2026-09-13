import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Coupon, CouponRedemption } from '../types.ts';
import { dataService, getOrCreateDeviceId } from '../services/dataService.ts';
import { Flame, QrCode, CheckCircle2, RotateCcw, Clock, ShieldCheck, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KioskCouponCarouselProps {
  coupons?: Coupon[];
  redemptions?: CouponRedemption[];
}

interface SingleCouponCardProps {
  coupon: Coupon;
  redemptions: CouponRedemption[];
  deviceId: string;
}

const SingleCouponCard: React.FC<SingleCouponCardProps> = ({ coupon, redemptions, deviceId }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isActivating, setIsActivating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [wasRedeemed, setWasRedeemed] = useState(false);

  // Find user's redemption record for this coupon
  const myRedemption = redemptions.find(
    (r) => r.couponId === coupon.id && r.deviceId === deviceId
  );

  const isRedeemed = Boolean(myRedemption && (myRedemption.status === 'redeemed' || myRedemption.redeemed));
  const isActivated = Boolean(myRedemption && !isRedeemed && myRedemption.status === 'active');

  // Trigger celebration confetti when redemption becomes successful in realtime
  useEffect(() => {
    if (isRedeemed && !wasRedeemed) {
      setWasRedeemed(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#081326', '#C8102E', '#10B981', '#F59E0B'],
        });
      } catch {
        // Fallback if canvas blocked
      }
    }
  }, [isRedeemed, wasRedeemed]);

  // Generate QR Code when activated and not redeemed
  useEffect(() => {
    if (!myRedemption || isRedeemed) {
      setQrUrl('');
      return;
    }

    const payload = `AGF-COUPON:${myRedemption.redemptionToken || myRedemption.id}`;
    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#081326',
        light: '#FFFFFF',
      },
    })
      .then(setQrUrl)
      .catch((err) => console.error('Error generating coupon QR:', err));
  }, [myRedemption?.id, myRedemption?.redemptionToken, isRedeemed]);

  // Expiration countdown
  useEffect(() => {
    if (!isActivated || !myRedemption?.expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expires = new Date(myRedemption.expiresAt).getTime();
      const diff = Math.max(0, expires - now);

      if (diff <= 0) {
        setTimeLeft('Udløbet');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActivated, myRedemption?.expiresAt]);

  const handleCardClick = async (e: React.MouseEvent) => {
    // If click was on a nested button, ignore
    if ((e.target as HTMLElement).closest('button.ignore-flip')) {
      return;
    }

    // If already redeemed, coupon cannot be reused
    if (isRedeemed) {
      return;
    }

    // If already activated, toggle flip between front and QR code
    if (isActivated) {
      setIsFlipped(!isFlipped);
      return;
    }

    // Not activated yet: activate coupon now and flip to reveal QR code
    try {
      setIsActivating(true);
      const res = await dataService.activateCoupon(coupon.id);
      setIsActivating(false);
      if (res.success) {
        setIsFlipped(true);
      }
    } catch {
      setIsActivating(false);
    }
  };

  // Optional remaining quantity calculation
  const remainingCount =
    coupon.maxRedemptions !== undefined && coupon.maxRedemptions > 0
      ? Math.max(0, coupon.maxRedemptions - (coupon.redemptionsCount || 0))
      : null;

  return (
    <div
      id={`coupon-card-${coupon.id}`}
      className="relative shrink-0 w-[285px] sm:w-[310px] h-[220px] [perspective:1000px] select-none cursor-pointer"
      onClick={handleCardClick}
      title={isRedeemed ? 'Kupon er allerede indløst' : 'Tryk for at vise/skjule QR-kode'}
    >
      <div
        className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] rounded-2xl ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* ================= FRONT OF CARD ================= */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all overflow-hidden ${
            isRedeemed
              ? 'bg-gray-50 border-gray-200/80 opacity-90'
              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          {/* Top Row: Sponsor & Price */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-red-600/10 text-red-700 text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-600 fill-current" />
                  <span>Dagens Tilbud</span>
                </span>
                {coupon.sponsor && (
                  <span className="text-[10px] text-gray-400 font-semibold truncate">
                    {coupon.sponsor}
                  </span>
                )}
              </div>

              {/* Price Pill */}
              <div className="flex items-baseline gap-1.5 shrink-0">
                {coupon.originalPrice && coupon.originalPrice > coupon.offerPrice && (
                  <span className="text-xs text-gray-400 line-through font-bold">
                    {coupon.originalPrice} kr.
                  </span>
                )}
                <span className="text-base font-black text-[#081326] bg-amber-400/25 px-2 py-0.5 rounded-lg border border-amber-300/40">
                  {coupon.offerPrice} kr.
                </span>
              </div>
            </div>

            {/* Title */}
            <h4 className="font-extrabold text-[#081326] text-sm leading-snug line-clamp-2">
              {coupon.title}
            </h4>

            {/* Short Description */}
            <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">
              {coupon.description}
            </p>
          </div>

          {/* Bottom Row: Remaining Quantity / Status & Tap CTA */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              {isRedeemed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-black uppercase tracking-wider border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KUPON BRUGT</span>
                </span>
              ) : remainingCount !== null ? (
                <span className="text-[11px] font-bold text-gray-400">
                  {remainingCount > 0 ? (
                    <span>Kun <strong className="text-red-600 font-extrabold">{remainingCount}</strong> tilbage</span>
                  ) : (
                    <span className="text-amber-600">Få tilbage</span>
                  )}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 font-semibold">
                  Gælder i arenaen
                </span>
              )}
            </div>

            {/* Tap Action */}
            {!isRedeemed && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#081326] text-white text-[11px] font-black uppercase tracking-wider shadow-xs hover:bg-[#081326]/90 transition-all">
                <QrCode className="w-3.5 h-3.5 text-red-400" />
                <span>{isActivating ? 'Aktiverer...' : isActivated ? 'Vis QR' : 'Aktivér'}</span>
              </div>
            )}
          </div>
        </div>

        {/* ================= BACK OF CARD (QR Code Reveal) ================= */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl p-3 flex flex-col items-center justify-between border shadow-md overflow-hidden ${
            isRedeemed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-[#081326] border-white/10 text-white'
          }`}
        >
          {isRedeemed ? (
            // REDEEMED STATE (KUPON BRUGT)
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2 shadow-xs">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="font-black text-base uppercase tracking-wider text-emerald-800">
                KUPON BRUGT
              </div>
              <p className="text-xs text-emerald-700/90 font-semibold mt-1">
                Kuponen er indløst ved skranken.
              </p>
              <div className="text-[10px] text-emerald-600/70 font-medium mt-0.5">
                Kan ikke genbruges på denne enhed.
              </div>
            </div>
          ) : (
            // ACTIVE QR CODE DISPLAY
            <>
              <div className="w-full flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                    Vis ved skranken
                  </span>
                </div>
                {timeLeft && (
                  <div className="flex items-center gap-1 text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-md text-amber-300">
                    <Clock className="w-3 h-3" />
                    <span>{timeLeft}</span>
                  </div>
                )}
              </div>

              {/* QR Code Graphic */}
              <div className="bg-white p-2 rounded-xl shadow-sm my-0.5">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Kupon QR kode"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center text-[10px] text-gray-400">
                    Indlæser QR...
                  </div>
                )}
              </div>

              {/* Friendly Code and Flip back button */}
              <div className="w-full flex items-center justify-between px-1 text-[10px]">
                <span className="font-mono text-gray-300 font-bold tracking-wider">
                  {myRedemption?.redemptionCode || 'AGF-MATCH'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                  }}
                  className="ignore-flip flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold uppercase cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Vend kort</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const KioskCouponCarousel: React.FC<KioskCouponCarouselProps> = ({ coupons = [], redemptions = [] }) => {
  const deviceId = getOrCreateDeviceId();

  // Filter only active coupons and sort them
  const activeCoupons = coupons
    .filter((c) => c.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // "If there are NO active coupons: hide the entire 'Dagens kuponer' section. Do not display an empty coupon container."
  if (activeCoupons.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-red-600/10 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-red-600 fill-current" />
          </div>
          <h3 className="font-black text-xs uppercase tracking-wider text-[#081326]">
            DAGENS KUPONER
          </h3>
          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white leading-none">
            {activeCoupons.length}
          </span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          Swipe & tryk for QR
        </span>
      </div>

      {/* Horizontal Swipeable Carousel */}
      <div
        id="kiosk-coupons-carousel"
        className="flex gap-3 overflow-x-auto pb-2 pt-0.5 px-0.5 snap-x snap-mandatory scrollbar-none"
      >
        {activeCoupons.map((coupon) => (
          <div key={coupon.id} className="snap-start shrink-0">
            <SingleCouponCard
              coupon={coupon}
              redemptions={redemptions}
              deviceId={deviceId}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
