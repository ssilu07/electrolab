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
  Star,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { billingService } from '../services/billingService';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  highlightReason?: string;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  highlightReason,
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

  const handleLifetime = async () => {
    soundFX.playClick();
    NativeBridge.haptic('medium');
    setLoading(true);
    setStatusMessage('Connecting to Google Play (Lifetime License)...');

    try {
      const result = await billingService.purchaseLifetime();
      if (result.success && result.isPro) {
        soundFX.playVictory();
        NativeBridge.haptic('success');
        triggerCelebration();
        setStatusMessage('Lifetime Pro Active! All ads removed & features unlocked permanently.');
        if (onSuccess) onSuccess();
      } else if (result.canceled) {
        setStatusMessage('Purchase canceled.');
      } else {
        setStatusMessage(result.message || 'Purchase could not be verified.');
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
    setStatusMessage('Checking active purchases on Google Play...');

    try {
      const res = await billingService.restorePurchases();
      if (res.isPro) {
        soundFX.playVictory();
        NativeBridge.haptic('success');
        triggerCelebration();
        setStatusMessage('Active Pro Subscription Restored!');
        if (onSuccess) onSuccess();
      } else {
        setStatusMessage('No active purchase found for this Google account.');
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-3xl border border-amber-500/40 p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.25)] relative overflow-hidden max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500/20"
      >
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Discount Urgency Pill */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-black tracking-widest uppercase shadow-md animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{billingService.isIndia ? 'SPECIAL STUDENT OFFER • 70% OFF' : 'LIMITED TIME OFFER • 50% OFF'}</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center pt-1 pb-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-xl shadow-amber-500/30 mb-2.5">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Electro<span className="text-cyan-400">Lab</span> <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">PRO</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            Zero Ads &bull; Unlock All 12+ Real DIY Experiments, Advanced ICs & Puzzle Challenges
          </p>

          {/* Contextual Reason Callout if triggered from a specific locked item */}
          {highlightReason && (
            <div className="mt-2.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{highlightReason}</span>
            </div>
          )}
        </div>

        {/* Pro Feature Highlights */}
        <div className="space-y-2 my-3">
          {[
            {
              icon: Zap,
              color: 'text-amber-400',
              title: 'All 12+ Real-World Experiments',
              desc: 'Water Tank Alarm, 220V Inverter, Diwali Running Chaser, Police Siren, Laser Tripwire',
            },
            {
              icon: Cpu,
              color: 'text-cyan-400',
              title: 'All Advanced ICs & Sensors',
              desc: 'NE555 Timer, Logic Gates (AND, OR, NOT, XOR), 2N2222 Transistor, Relays, LDR',
            },
            {
              icon: Layers,
              color: 'text-emerald-400',
              title: 'All Challenge Puzzle Levels',
              desc: 'Instant access to Level 3, 4, 5+ challenges with circuit design solutions',
            },
            {
              icon: Ban,
              color: 'text-rose-400',
              title: '100% Ad-Free Forever',
              desc: 'Zero interstitial popups and banner ads — uninterrupted hands-on learning',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-amber-500/30 transition"
              >
                <div className={`p-2 rounded-xl bg-white/5 shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{item.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Social Proof Bar */}
        <div className="flex items-center justify-center gap-1.5 py-1 text-slate-400 text-[11px] font-medium">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400" />
            ))}
          </div>
          <span>4.9/5 Rating &bull; Loved by 50,000+ STEM Students & Engineers</span>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="my-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center text-xs font-mono text-amber-300">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        {isPro ? (
          <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-center mt-3">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>ElectroLab Pro Active!</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Zero Ads &bull; All 12+ real-world experiments and advanced ICs are permanently unlocked.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pt-2">
            {/* Primary Hero Option: LIFETIME LICENSE (Best Seller) */}
            <button
              onClick={handleLifetime}
              disabled={loading}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-left transition-all duration-200 active:scale-[0.98] shadow-xl shadow-amber-500/30 border-2 border-yellow-200 flex items-center justify-between gap-3 group relative overflow-hidden"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 uppercase tracking-wider">
                    BEST VALUE • ONE-TIME
                  </span>
                  <span className="text-[11px] font-bold text-slate-800 line-through">
                    {billingService.originalPriceDisplay}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-950 mt-1 flex items-baseline gap-1.5">
                  <span>{billingService.lifetimePriceDisplay}</span>
                  <span className="text-xs font-bold text-slate-800">Lifetime (Pay Once, Keep Forever)</span>
                </div>
                <p className="text-[11px] text-slate-900 font-semibold mt-0.5">
                  No monthly auto-debit &bull; Instant permanent unlock &bull; All future updates included
                </p>
              </div>

              <div className="shrink-0 p-2.5 rounded-xl bg-slate-950 text-amber-400 shadow-md group-hover:scale-110 transition-transform">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5 fill-amber-400" />}
              </div>
            </button>

            {/* Secondary Option: Monthly Subscription */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-cyan-400 text-left transition active:scale-[0.98] flex items-center justify-between gap-3 disabled:opacity-50 group"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                    MONTHLY
                  </span>
                  <span className="text-xs font-bold text-white">Monthly Student Pass</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {billingService.priceDisplay} &bull; Cancel anytime with 1 tap in Google Play
                </div>
              </div>

              <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                Subscribe &rarr;
              </span>
            </button>

            {/* Restore and Google Security note */}
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 pt-1">
              <button
                onClick={handleRestore}
                disabled={loading}
                className="hover:text-amber-400 transition flex items-center gap-1 font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Purchase</span>
              </button>
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Google Play Billing Verified</span>
              </span>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <p className="text-[10px] text-slate-500 text-center mt-3">
          100% Safe Checkout via Google Play. Instant activation across all Android devices.
        </p>
      </div>
    </div>
  );
};
