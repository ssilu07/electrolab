import React, { useState, useEffect } from 'react';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Zap,
  Cpu,
  Layers,
  X,
  Loader2,
  Ban,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { billingService } from '../services/billingService';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isPro, setIsPro] = useState(billingService.isPro);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = billingService.onProStatusChange((pro) => {
      setIsPro(pro);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    soundFX.playClick();
    NativeBridge.haptic('medium');
    setLoading(true);
    setStatusMessage('Connecting to Google Play Subscription...');

    try {
      const result = await billingService.subscribeMonthly();
      if (result.success && result.isPro) {
        soundFX.playVictory();
        NativeBridge.haptic('success');
        triggerCelebration();
        setStatusMessage('Subscription Active! All ads removed & features unlocked.');
        if (onSuccess) onSuccess();
      } else if (result.canceled) {
        setStatusMessage('Subscription canceled.');
      } else {
        setStatusMessage(result.message || 'Subscription could not be verified.');
      }
    } catch (e: any) {
      setStatusMessage('Error: ' + (e?.message || 'Transaction failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    soundFX.playClick();
    NativeBridge.haptic('light');
    setLoading(true);
    setStatusMessage('Checking active subscriptions on Google Play...');

    try {
      const res = await billingService.restorePurchases();
      if (res.isPro) {
        soundFX.playVictory();
        NativeBridge.haptic('success');
        triggerCelebration();
        setStatusMessage('Active Pro Subscription Restored!');
        if (onSuccess) onSuccess();
      } else {
        setStatusMessage('No active subscription found for this Google account.');
      }
    } catch (e: any) {
      setStatusMessage('Restore failed: ' + (e?.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-3xl border border-cyan-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-amber-300 p-0.5 shadow-lg shadow-cyan-500/25 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Electro<span className="text-cyan-400">Lab</span> PRO
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero Ads &bull; Unlock All Engineering Instruments & Challenges
          </p>
        </div>

        {/* Pro Feature Highlights */}
        <div className="space-y-2.5 my-4">
          {[
            {
              icon: Ban,
              color: 'text-rose-400',
              title: '100% Ad-Free Experience',
              desc: 'Completely removes banner and interstitial pop-up ads',
            },
            {
              icon: Zap,
              color: 'text-amber-400',
              title: 'All Circuit Puzzles & Challenges',
              desc: 'Instant access to all current and upcoming puzzle levels',
            },
            {
              icon: Cpu,
              color: 'text-cyan-400',
              title: 'Pro Instruments & Oscilloscope',
              desc: 'High-frequency signal generators, FFT spectrum & power stats',
            },
            {
              icon: Layers,
              color: 'text-emerald-400',
              title: 'Unlimited Custom Presets',
              desc: 'Save and export unlimited complex circuit blueprints',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 transition"
              >
                <div className={`p-2 rounded-xl bg-white/5 shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{item.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="my-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center text-xs font-mono text-cyan-300">
            {statusMessage}
          </div>
        )}

        {/* Action Button */}
        {isPro ? (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>ElectroLab Pro Active!</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Zero Ads &bull; All features and laboratory instruments are unlocked.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/30 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Connecting to Google Play...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Subscribe to Pro &bull; {billingService.priceDisplay}</span>
                </>
              )}
            </button>

            {/* Restore and Google Security note */}
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <button
                onClick={handleRestore}
                disabled={loading}
                className="hover:text-cyan-400 transition flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Subscription</span>
              </button>
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Google Play Billing v8</span>
              </span>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <p className="text-[10px] text-slate-500 text-center mt-4">
          Cancel anytime easily via Google Play Store subscriptions. Syncs across all devices.
        </p>
      </div>
    </div>
  );
};
