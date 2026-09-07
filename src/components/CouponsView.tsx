import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Coupon, CouponRedemption } from '../types.ts';
import { dataService, getOrCreateDeviceId } from '../services/dataService.ts';
import { Clock, Flame, CheckCircle, X, QrCode, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CouponsViewProps {
  coupons: Coupon[];
  redemptions: CouponRedemption[];
}

export const CouponsView: React.FC<CouponsViewProps> = ({ coupons, redemptions }) => {
  const [activeRedemptionModal, setActiveRedemptionModal] = useState<CouponRedemption | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('00:00');

  const deviceId = getOrCreateDeviceId();
  const activeCoupons = coupons.filter((c) => c.active);

  // Check all redemptions for this device
  const deviceRedemptions = redemptions.filter((r) => r.deviceId === deviceId);

  // Keep activeRedemptionModal synchronized in REAL-TIME with latest database updates (SSE / push)
  useEffect(() => {
    if (!activeRedemptionModal) return;

    const latest = redemptions.find(
      (r) =>
        r.id === activeRedemptionModal.id ||
        (r.couponId === activeRedemptionModal.couponId && r.deviceId === deviceId)
    );

    if (latest) {
      // Check if it just transitioned from active to redeemed
      const wasActive = activeRedemptionModal.status === 'active' && !activeRedemptionModal.redeemed;
      const isNowRedeemed = latest.status === 'redeemed' || latest.redeemed;

      if (wasActive && isNowRedeemed) {
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

      setActiveRedemptionModal(latest);
    }
  }, [redemptions, deviceId, activeRedemptionModal]);

  // Generate QR code whenever active redemption changes and is active
  useEffect(() => {
    if (!activeRedemptionModal) {
      setQrCodeDataUrl('');
      return;
    }

    if (activeRedemptionModal.status === 'redeemed' || activeRedemptionModal.redeemed) {
      // Remove/disable QR code immediately after successful redemption
      setQrCodeDataUrl('');
      return;
    }

    // Embed the cryptographically secure token
    const payload = `AGF-COUPON:${activeRedemptionModal.redemptionToken || activeRedemptionModal.id}`;

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#081326',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [activeRedemptionModal]);

  // Countdown timer for active unredeemed coupon
  useEffect(() => {
    if (!activeRedemptionModal || activeRedemptionModal.status !== 'active' || activeRedemptionModal.redeemed) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(activeRedemptionModal.expiresAt).getTime();
      const diff = Math.max(0, expires - now);

      if (diff <= 0) {
        setTimeLeftStr('00:00');
        setActiveRedemptionModal((prev) => (prev ? { ...prev, status: 'expired' } : null));
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftStr(
          `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRedemptionModal]);

  const handleActivate = async (coupon: Coupon) => {
    setIsActivating(true);
    setErrorMessage(null);

    const res = await dataService.activateCoupon(coupon.id);
    setIsActivating(false);

    if (res.success && res.redemption) {
      setActiveRedemptionModal(res.redemption);
    } else {
      setErrorMessage(res.error || 'Kunne ikke aktivere kupon');
    }
  };

  return (
    <div className="pb-20 pt-2 space-y-4">
      {/* Header banner with Bold Typography styling */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 shadow-md border border-gray-800">
        <div className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-widest mb-1">
          <Flame className="w-4 h-4 fill-current" />
          <span>Eksklusive Matchday fordele</span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">
          Tilbud & Kuponer
        </h1>
        <p className="text-xs font-medium text-gray-300 mt-1 leading-relaxed">
          Aktivér din kupon og vis den unikke QR-kode i kiosken. Personalet scanner koden fra din skærm.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-red-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Coupons list */}
      {activeCoupons.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
          <p className="font-bold text-sm text-[#081326]">Ingen aktive kuponer lige nu</p>
          <p className="text-xs text-gray-500 mt-1">Hold øje med arenaens storskærme i pausen!</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {activeCoupons.map((coupon) => {
            const userRedemption = deviceRedemptions.find((r) => r.couponId === coupon.id);
            const isRedeemed = userRedemption?.status === 'redeemed' || userRedemption?.redeemed;
            const isActiveOnDevice =
              userRedemption?.status === 'active' &&
              !isRedeemed &&
              new Date(userRedemption.expiresAt) > new Date();

            return (
              <div
                key={coupon.id}
                id={`coupon-card-${coupon.id}`}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm relative overflow-hidden"
              >
                {/* Visual savings badge */}
                {coupon.originalPrice && coupon.originalPrice > coupon.offerPrice && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 rounded-bl-xl font-black text-[11px] tracking-wider uppercase shadow-xs">
                    Spar {coupon.originalPrice - coupon.offerPrice} kr.
                  </div>
                )}

                <div className="pr-16">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 inline-block">
                    Pausetilbud
                  </span>
                  <h2 className="font-black text-base sm:text-lg text-[#081326] mt-1.5 leading-snug">
                    {coupon.title}
                  </h2>
                </div>

                <p className="text-xs font-medium text-gray-600 mt-2 leading-relaxed">
                  {coupon.description}
                </p>

                {/* Price and timer pill */}
                <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-2xl text-[#081326] tracking-tight">
                        {coupon.offerPrice} kr.
                      </span>
                      {coupon.originalPrice && (
                        <span className="text-xs text-gray-400 line-through font-semibold">
                          {coupon.originalPrice} kr.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Gyldig i {coupon.activationDurationMinutes} min efter aktivering</span>
                    </div>
                  </div>

                  {coupon.sponsor && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400 block font-bold">
                        Partner
                      </span>
                      <span className="text-xs font-black text-gray-800">{coupon.sponsor}</span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="mt-4">
                  {isRedeemed ? (
                    <button
                      onClick={() => setActiveRedemptionModal(userRedemption)}
                      className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-2 border border-gray-200 transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>✓ Kupon indløst (Vis kvittering)</span>
                    </button>
                  ) : isActiveOnDevice ? (
                    <button
                      onClick={() => setActiveRedemptionModal(userRedemption)}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Vis aktiv QR-kode ({timeLeftStr})</span>
                    </button>
                  ) : (
                    <button
                      id={`activate-coupon-${coupon.id}`}
                      disabled={isActivating}
                      onClick={() => handleActivate(coupon)}
                      className="w-full py-3.5 rounded-xl bg-[#081326] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Flame className="w-4 h-4 text-red-500" />
                      <span>{isActivating ? 'Aktiverer...' : 'Aktivér kupon'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer QR Redemption Modal */}
      {activeRedemptionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-[#081326] text-center relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setActiveRedemptionModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* STATE 1: REDEEMED (Staff has scanned & backend validated) */}
            {activeRedemptionModal.status === 'redeemed' || activeRedemptionModal.redeemed ? (
              <div className="py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle className="w-10 h-10" />
                </div>
                {/* Specific required copy */}
                <h3 className="text-2xl font-black text-emerald-700 uppercase tracking-tight">
                  ✓ KUPON INDLØST
                </h3>
                <p className="text-sm font-black text-[#081326] mt-1">
                  Tak – kuponen er blevet brugt
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Kuponen er godkendt af kioskpersonalet. Velbekomme!
                </p>

                {activeRedemptionModal.redeemedAt && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-left border border-gray-100">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span className="font-semibold">Indløst:</span>
                      <span className="font-mono font-bold text-[#081326]">
                        {new Date(activeRedemptionModal.redeemedAt).toLocaleTimeString('da-DK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    {activeRedemptionModal.redeemedByStaffName && (
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span className="font-semibold">Godkendt af:</span>
                        <span className="font-bold text-[#081326]">
                          {activeRedemptionModal.redeemedByStaffName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => setActiveRedemptionModal(null)}
                  className="mt-6 w-full py-3 bg-[#081326] text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Luk
                </button>
              </div>
            ) : activeRedemptionModal.status === 'expired' ? (
              /* STATE 2: EXPIRED */
              <div className="py-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-800 uppercase">
                  Kupon Udløbet
                </h3>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Tidsfristen for denne aktivering er desværre overskredet.
                </p>
                <button
                  onClick={() => setActiveRedemptionModal(null)}
                  className="mt-5 w-full py-2.5 bg-gray-200 text-gray-700 text-xs font-black uppercase rounded-xl cursor-pointer"
                >
                  Luk
                </button>
              </div>
            ) : (
              /* STATE 3: ACTIVE COUPON (Awaiting Staff Scan) */
              <div>
                {/* AKTIV KUPON Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>AKTIV KUPON</span>
                </div>

                {/* Coupon title & Offer details */}
                <h3 className="text-lg font-black text-[#081326] mt-1 uppercase tracking-tight">
                  {coupons.find((c) => c.id === activeRedemptionModal.couponId)?.title || 'Pausetilbud'}
                </h3>
                <p className="text-xs font-semibold text-gray-600 mt-0.5">
                  {coupons.find((c) => c.id === activeRedemptionModal.couponId)?.description}
                </p>

                {/* Large Unique Single-Use QR Code */}
                <div className="my-4 p-3 bg-white rounded-2xl border-2 border-gray-200 shadow-inner inline-block">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Kupon QR-kode for personale scanning"
                      className="w-56 h-56 max-w-[65vw] max-h-[65vw] object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-xs font-mono text-gray-400">
                      Genererer QR-kode...
                    </div>
                  )}
                </div>

                {/* Required text: Vis QR-koden i kiosken */}
                <p className="text-sm font-black text-[#081326] uppercase tracking-wide">
                  Vis QR-koden i kiosken
                </p>

                {/* Live Countdown: Gyldig i 08:42 */}
                <div className="mt-3 py-2.5 px-4 rounded-xl bg-[#081326] text-white flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Gyldig i
                  </span>
                  <span className="font-mono text-xl font-black text-amber-400 tracking-wider">
                    {timeLeftStr}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sikker engangskode • Venter på kioskens scanner...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
