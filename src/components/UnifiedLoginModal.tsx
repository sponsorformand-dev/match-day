import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService.ts';
import { StaffRole } from '../types.ts';

interface UnifiedLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: StaffRole) => void;
}

export const UnifiedLoginModal: React.FC<UnifiedLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Indtast venligst adgangskode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deviceLabel = navigator.userAgent.includes('Mobile') ? 'Mobil enhed' : 'Desktop terminal';
      const res = await dataService.login(code.trim(), deviceLabel);

      if (res.success && res.role) {
        setCode('');
        onLoginSuccess(res.role);
        onClose();
      } else {
        setError(res.error || 'Forkert adgangskode. Prøv igen.');
      }
    } catch {
      setError('Der opstod en fejl ved login. Kontroller forbindelsen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="unified-login-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#081326] text-white p-5 sm:p-6 relative">
          <button
            id="login-close-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Luk"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block">
                AGF HÅNDBOLD · MATCHDAY
              </span>
              <h3 className="text-lg font-black uppercase tracking-tight text-white leading-tight">
                Personale & Admin
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            Indtast din adgangskode for at få adgang til kuponscanner eller administration. Systemet tildeler automatisk dine rettigheder.
          </p>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-1.5">
              Adgangskode
            </label>
            <div className="relative">
              <input
                id="login-code-input"
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Indtast kode..."
                autoFocus
                className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-[#081326] focus:ring-2 focus:ring-[#081326]/10 text-sm font-semibold tracking-wider transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                aria-label={showCode ? 'Skjul kode' : 'Vis kode'}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-gray-400 font-medium block mt-1.5">
              Aktiv session gemmes automatisk i 12 timer på denne enhed.
            </span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Annuller
            </button>
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? 'Logger ind...' : 'Log ind'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
