import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ScanLine,
  UserCheck,
  RotateCcw,
  LogOut,
  ShieldCheck,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { dataService, ScanRedeemResult } from '../services/dataService.ts';
import { StaffUser, MatchdayDatabase } from '../types.ts';

interface StaffScannerViewProps {
  db: MatchdayDatabase;
  onExit?: () => void;
}

// Audio chimes using Web Audio API for zero external dependency reliability
function playAudioFeedback(type: 'success' | 'error') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15); // E3
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Silent fallback
  }

  // Haptic feedback if available
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    if (type === 'success') navigator.vibrate([80, 50, 80]);
    else navigator.vibrate([200, 100, 200]);
  }
}

export const StaffScannerView: React.FC<StaffScannerViewProps> = ({ db, onExit }) => {
  // Staff Auth State
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const session = dataService.getCurrentSession();
    if (session) {
      return {
        id: session.id,
        name: session.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: session.role,
        pin: '',
        createdAt: new Date().toISOString(),
      };
    }
    return dataService.getCurrentStaffUser();
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Scanner State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanRedeemResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isCooldownRef = useRef<boolean>(false);

  // Handle Staff login
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    setAuthError(null);
    const res = await dataService.login(pinInput.trim());
    if (res.success && res.role) {
      setCurrentUser({
        id: 'sess-' + Date.now(),
        name: res.role === 'ADMIN' ? 'Administrator' : 'Personale',
        role: res.role,
        pin: '',
        createdAt: new Date().toISOString(),
      });
      setPinInput('');
    } else {
      setAuthError(res.error || 'Forkert adgangskode');
    }
  };

  const handleLogout = () => {
    stopCamera();
    dataService.logout();
    setCurrentUser(null);
    setLastResult(null);
  };

  // Start Camera QR Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader-container');
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        () => {
          // Scanning frame callback
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Kamera kunne ikke startes (tjek kameratilladelse). Du kan i stedet bruge manuel kodeindtastning herunder.'
      );
      setIsScanning(false);
      setShowManualInput(true);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // ignore
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      // Auto-attempt starting camera on login
      startCamera();
    }
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => scannerRef.current?.clear());
        } catch {
          // ignore
        }
      }
    };
  }, [currentUser]);

  // Core Atomic Validation Handler
  const handleScannedCode = async (rawCode: string) => {
    if (isCooldownRef.current || isProcessing) return;
    isCooldownRef.current = true;
    setIsProcessing(true);

    try {
      const result = await dataService.redeemScan(
        rawCode,
        currentUser?.pin,
        currentUser?.id
      );
      setLastResult(result);

      if (result.status === 'SUCCESS' || result.status === 'VALID') {
        playAudioFeedback('success');
      } else {
        playAudioFeedback('error');
      }
    } catch (err) {
      setLastResult({
        status: 'ERROR',
        error: 'Netværksfejl under scanning',
      });
      playAudioFeedback('error');
    } finally {
      setIsProcessing(false);
      // Wait 3 seconds cooldown before auto-allowing next scan
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 2500);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    handleScannedCode(manualTokenInput.trim());
    setManualTokenInput('');
  };

  // -------------------------------------------------------------
  // LOGIN SCREEN (If not logged in as Staff/Admin)
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#081326] shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-red-600 p-2 flex items-center justify-center mx-auto mb-4 shadow-md">
            <img src="/agf-logo.svg" alt="AGF Håndbold" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tight text-[#081326]">
            Kiosk Kuponscanner
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Indtast adgangskode for at åbne scanneren
          </p>

          <form onSubmit={handlePinLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Indtast adgangskode..."
                className="w-full text-center tracking-[0.2em] font-mono text-xl font-black py-3.5 px-4 bg-gray-50 rounded-2xl border-2 border-gray-300 focus:border-red-600 focus:bg-white outline-hidden transition-all"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Åbn Scanner
            </button>
          </form>

          {onExit && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
              <button
                onClick={onExit}
                className="font-bold text-xs uppercase tracking-wider text-gray-500 hover:text-red-600 cursor-pointer"
              >
                Luk
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCANNER INTERFACE FOR AUTHENTICATED STAFF
  // -------------------------------------------------------------
  // Calculate this staff member's scans today
  const myRedemptions = (db.couponRedemptions || []).filter(
    (r) => r.redeemedByStaffId === currentUser.id
  );

  return (
    <div className="pb-24 pt-2 space-y-4 max-w-lg mx-auto">
      {/* Top Staff Status Bar */}
      <div className="bg-[#081326] text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-sm">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm uppercase tracking-tight">{currentUser.name}</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-gray-200">
                {currentUser.role}
              </span>
            </div>
            <div className="text-[11px] text-gray-300 font-medium">
              Dine scanninger i dag: <strong className="text-white font-mono">{myRedemptions.length}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            title="Log ud af scanner"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-wider text-white cursor-pointer"
            >
              Luk
            </button>
          )}
        </div>
      </div>

      {/* SCAN RESULT OVERLAY / CARD */}
      {lastResult && (
        <div
          className={`rounded-2xl p-5 border-2 shadow-lg transition-all animate-scale-up ${
            lastResult.status === 'SUCCESS' || lastResult.status === 'VALID'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : lastResult.status === 'ALREADY_USED' || lastResult.status === 'ALREADY_REDEEMED'
              ? 'bg-amber-50 border-amber-500 text-amber-950'
              : lastResult.status === 'EXPIRED'
              ? 'bg-orange-50 border-orange-500 text-orange-950'
              : lastResult.status === 'INACTIVE' || lastResult.status === 'INACTIVE_OFFER'
              ? 'bg-slate-100 border-slate-400 text-slate-900'
              : 'bg-red-50 border-red-500 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {lastResult.status === 'SUCCESS' || lastResult.status === 'VALID' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : lastResult.status === 'ALREADY_USED' || lastResult.status === 'ALREADY_REDEEMED' ? (
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg uppercase tracking-tight">
                  {lastResult.status === 'SUCCESS' || lastResult.status === 'VALID'
                    ? 'KUPON GODKENDT'
                    : lastResult.status === 'ALREADY_USED' || lastResult.status === 'ALREADY_REDEEMED'
                    ? 'ALLEREDE BRUGT'
                    : lastResult.status === 'EXPIRED'
                    ? 'UDLØBET'
                    : lastResult.status === 'INACTIVE' || lastResult.status === 'INACTIVE_OFFER'
                    ? 'UGYLDIG KUPON (IKKE AKTIV)'
                    : lastResult.status === 'NOT_FOUND'
                    ? 'UGYLDIG KUPON'
                    : 'UGYLDIG KUPON'}
                </h3>
                <span className="text-[11px] font-mono font-bold opacity-75">
                  {lastResult.redeemedTime || new Date().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {lastResult.couponName && (
                <p className="font-black text-base mt-1 text-[#081326]">
                  {lastResult.couponName}
                </p>
              )}

              {lastResult.offerDetails && (
                <p className="text-xs font-bold text-gray-700 mt-0.5">
                  Tilbudspris: {lastResult.offerDetails}
                </p>
              )}

              {(lastResult.status === 'ALREADY_USED' || lastResult.status === 'ALREADY_REDEEMED') && (
                <div className="mt-2 text-xs font-semibold bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
                  <p>
                    Denne kupon er allerede indløst tidligere!
                  </p>
                  {lastResult.redeemedAt && (
                    <p className="text-[11px] mt-0.5 opacity-80">
                      Tidligere indløst kl. {lastResult.redeemedAt} af {lastResult.redeemedBy}
                    </p>
                  )}
                </div>
              )}

              {lastResult.message && lastResult.status !== 'SUCCESS' && lastResult.status !== 'VALID' && (
                <p className="text-xs mt-1 opacity-90">{lastResult.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/10 flex items-center justify-between">
            <button
              onClick={() => setLastResult(null)}
              className="w-full py-2.5 bg-[#081326] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
            >
              Scan Næste Kupon
            </button>
          </div>
        </div>
      )}

      {/* Main Viewfinder Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-gray-200 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-red-600" />
            <span className="font-black text-xs uppercase tracking-wider text-[#081326]">
              Ret kamera mod gæstens QR-kode
            </span>
          </div>

          <button
            onClick={() => {
              if (isScanning) stopCamera();
              else startCamera();
            }}
            className="text-[11px] font-bold text-gray-500 hover:text-[#081326] flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Genstart' : 'Start'}</span>
          </button>
        </div>

        {/* The video container for Html5Qrcode */}
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square w-full max-w-[340px] mx-auto border-2 border-[#081326] shadow-inner flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full"></div>

          {/* Crosshair Overlay */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-red-500/80 rounded-2xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-red-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-red-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-red-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-red-500 -mb-1 -mr-1"></div>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-[#081326]/80 flex flex-col items-center justify-center text-white p-4">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="font-black uppercase tracking-wider text-xs">
                Validerer Kupon i Serveren...
              </p>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold">
            {cameraError}
          </div>
        )}

        {/* Quick Test / Manual Entry Toggle */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs font-black uppercase tracking-wider text-gray-600 hover:text-[#081326] flex items-center gap-1.5 cursor-pointer"
            >
              <Keyboard className="w-4 h-4 text-red-600" />
              <span>{showManualInput ? 'Skjul manuel indtastning' : 'Indtast kode manuelt'}</span>
            </button>
          </div>

          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="Indtast kuponkode..."
                className="flex-1 text-xs font-mono font-bold px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-red-600 outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#081326] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-black transition-colors cursor-pointer"
              >
                Indløs
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Recent Scans Feed */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-black text-xs uppercase tracking-wider text-[#081326]">
            SENESTE SCANNINGER
          </h4>
          <span className="text-[10px] font-bold text-gray-400">
            {db.redemptionLogs?.length || 0} scanninger
          </span>
        </div>

        {(!db.redemptionLogs || db.redemptionLogs.length === 0) ? (
          <p className="text-xs text-gray-400 py-3 text-center">
            Ingen scanninger registreret endnu.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {db.redemptionLogs.slice(0, 10).map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString('da-DK', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const statusText =
                log.status === 'success'
                  ? 'Godkendt'
                  : log.status === 'already_used'
                  ? 'Allerede brugt'
                  : log.status === 'expired'
                  ? 'Udløbet'
                  : 'Ugyldig';

              return (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div className="font-semibold text-[#081326] truncate pr-2">
                    <span className="font-mono text-gray-500 mr-1.5">{timeStr}</span>
                    <span>·</span>
                    <span className="mx-1.5 font-bold">{log.couponTitle}</span>
                    <span>·</span>
                    <span
                      className={`ml-1.5 font-bold ${
                        log.status === 'success'
                          ? 'text-emerald-700'
                          : log.status === 'already_used'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
