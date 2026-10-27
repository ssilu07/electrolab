import React, { useState } from 'react';
import { soundFX } from '../audio/SoundFX';
import { NativeBridge } from '../utils/nativeBridge';
import {
  ShieldCheck,
  X,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Smartphone,
  EyeOff,
  Users,
  Mail,
  Code,
  Globe,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PRIVACY_POLICY_TEXT = `PRIVACY POLICY FOR ELECTROLAB
Effective Date: October 2026
App Name: ElectroLab (ElectroCraft Physics & Circuit Lab)
Package Name: com.royals.electolab

1. OVERVIEW
ElectroLab is an educational interactive electronics and circuit simulator designed for students, hobbyists, engineers, and educators. We respect your privacy and are committed to protecting it. This Privacy Policy explains our practices regarding user data.

2. ZERO DATA COLLECTION (WE DO NOT COLLECT YOUR DATA)
ElectroLab does NOT collect, store, track, sell, or transmit any Personally Identifiable Information (PII) such as:
- Name, address, phone number, or email address
- Device contacts or calendar events
- Precise or coarse GPS location data
- Payment credentials or financial details
- Browsing history or third-party tracking identifiers

3. DEVICE PERMISSIONS & HARDWARE USAGE
ElectroLab requests only the minimum permissions required for interactive simulation features:
- Haptic Feedback (Vibration): Used strictly to provide tactile feedback when pressing buttons, toggling switches, or when circuit components overload.
- Web Audio API: Used exclusively for synthesized simulation sound effects (relay clicks, capacitor discharges, 555 timer audio beeps, buzzers). We do NOT record audio or request microphone access.
- Local Storage: Circuit files, sandbox states, and user preferences are saved strictly on your local device.
- Screen Capture & Image Export: When you use the "Snapshot" or "Export" feature, an image is rendered locally on your device for you to save or share.

4. CHILDREN'S PRIVACY (COPPA & GDPR-K COMPLIANCE)
ElectroLab is fully compliant with the Children's Online Privacy Protection Act (COPPA) and General Data Protection Regulation (GDPR). Our application is safe for children of all ages. We do not knowingly collect personal information from children under the age of 13.

5. ADVERTISING & ANALYTICS
ElectroLab contains NO third-party ad networks, tracking cookies, or tracking beacons. We do not profile users for commercial advertising purposes.

6. CIRCUIT SHARING
When you share circuits using the "Share" feature, the circuit schematic is encoded directly into a shareable URL hash or JSON data. No personal identifiers are attached to circuit schematics.

7. DATA SECURITY & RETENTION
All circuits, levels, and settings remain solely on your device. You can erase all data at any time by clearing the application storage or using the "Clear Board" function.

8. CONTACT & SUPPORT
If you have questions or feedback regarding this Privacy Policy, please reach out to:
Developer: ElectroLab Development Team
Support Email: sumits7196@gmail.com
Website / Hosted Policy: https://sites.google.com/view/electrolab-privacy-policy`;

export const EMBED_HTML_CODE = `<!-- ElectroLab Privacy Policy Embed for Google Sites -->
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #e2e8f0; padding: 28px; border-radius: 18px; border: 1px solid #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6;">
  <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
    <span style="background: rgba(6, 182, 212, 0.15); color: #22d3ee; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(6, 182, 212, 0.3);">Verified Privacy Policy</span>
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 4px 0;">ElectroLab Privacy Policy</h1>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">App Package: <code style="color: #38bdf8; background: #0f172a; padding: 2px 6px; border-radius: 4px;">com.royals.electolab</code> &bull; Last Updated: October 2026</p>
  </div>

  <div style="margin-bottom: 18px;">
    <h2 style="color: #38bdf8; font-size: 16px; font-weight: 700; margin: 16px 0 6px 0;">1. Overview</h2>
    <p style="font-size: 13px; color: #cbd5e1; margin: 0;">ElectroLab is an educational interactive electronics and circuit simulator. We prioritize user privacy and strictly operate with a zero-data-collection philosophy.</p>
  </div>

  <div style="margin-bottom: 18px; background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border-left: 4px solid #10b981;">
    <h2 style="color: #34d399; font-size: 15px; font-weight: 700; margin: 0 0 6px 0;">2. Zero Data Collection Guarantee</h2>
    <p style="font-size: 13px; color: #cbd5e1; margin: 0;">ElectroLab does <strong>NOT</strong> collect, transmit, store, or sell any personal data, emails, locations, or identity info. All simulations execute completely client-side in real time.</p>
  </div>

  <div style="margin-bottom: 18px;">
    <h2 style="color: #38bdf8; font-size: 16px; font-weight: 700; margin: 16px 0 6px 0;">3. Permissions & Device Features</h2>
    <ul style="font-size: 13px; color: #cbd5e1; padding-left: 20px; margin: 6px 0;">
      <li style="margin-bottom: 4px;"><strong>Haptics (Vibration):</strong> Provides tactile button clicks and overload alerts.</li>
      <li style="margin-bottom: 4px;"><strong>Audio Synthesizer:</strong> Plays simulated electrical sounds (buzzers, relay clicks). No microphone is used.</li>
      <li style="margin-bottom: 4px;"><strong>Local Storage:</strong> Saves your customized circuits strictly on your own device.</li>
    </ul>
  </div>

  <div style="margin-bottom: 18px;">
    <h2 style="color: #38bdf8; font-size: 16px; font-weight: 700; margin: 16px 0 6px 0;">4. Children's Privacy (COPPA & GDPR Compliant)</h2>
    <p style="font-size: 13px; color: #cbd5e1; margin: 0;">ElectroLab is fully compliant with COPPA and GDPR regulations. Safe for classroom and student learning with zero targeted ads.</p>
  </div>

  <div style="margin-bottom: 18px;">
    <h2 style="color: #38bdf8; font-size: 16px; font-weight: 700; margin: 16px 0 6px 0;">5. Contact Information</h2>
    <p style="font-size: 13px; color: #cbd5e1; margin: 0;">Support Email: <a href="mailto:sumits7196@gmail.com" style="color: #38bdf8; text-decoration: none;">sumits7196@gmail.com</a></p>
  </div>
</div>`;

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'google-sites' | 'embed-code'>('policy');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(PRIVACY_POLICY_TEXT);
      soundFX.playClick(1.4);
      NativeBridge.haptic('light');
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(EMBED_HTML_CODE);
      soundFX.playClick(1.4);
      NativeBridge.haptic('light');
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenGoogleSites = () => {
    soundFX.playClick();
    NativeBridge.haptic('medium');
    window.open('https://sites.google.com/new', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-md animate-in fade-in transition-all duration-300"
      onClick={onClose}
    >
      {/* Slide-in Panel from right (Slide sheet / modal) */}
      <div
        className="w-full max-w-2xl h-full glass-modal border-l border-white/10 shadow-2xl flex flex-col font-sans text-slate-200 animate-in slide-in-from-right duration-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base md:text-lg text-white">Privacy Policy</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
                  100% Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ElectroLab &bull; <code className="text-cyan-400">com.royals.electolab</code>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              NativeBridge.haptic('light');
              onClose();
            }}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
            aria-label="Close Privacy Policy slide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-2 bg-slate-900/60 border-b border-slate-800/80 px-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('policy');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'policy'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Policy Document</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('google-sites');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'google-sites'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Sites Guide</span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              setActiveTab('embed-code');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'embed-code'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Embed HTML Code</span>
          </button>
        </div>

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 font-sans text-xs md:text-sm text-slate-300 leading-relaxed">
          {/* TAB 1: Policy Document */}
          {activeTab === 'policy' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-900/70 border border-emerald-500/30 p-3 rounded-2xl flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-400">Zero Data Collection</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">No personal data, telemetry, or cookies are stored.</p>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-cyan-500/30 p-3 rounded-2xl flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-cyan-400">COPPA & Student Safe</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Compliant for all ages, schools, and children.</p>
                  </div>
                </div>

                <div className="bg-slate-900/70 border border-amber-500/30 p-3 rounded-2xl flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-amber-400">Device Local Only</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Circuits saved exclusively on your local storage.</p>
                  </div>
                </div>
              </div>

              {/* Full Policy Sections */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
                <section>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-cyan-400 rounded-full" />
                    1. Application Scope & Purpose
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    ElectroLab is an educational electronics simulator created to help learners, hobbyists, and engineers interactively design, test, and analyze electronic circuits with real-time physics and schematic rendering.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-cyan-400 rounded-full" />
                    2. Information We Do NOT Collect
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    ElectroLab is built with privacy-first principles:
                  </p>
                  <ul className="list-disc pl-5 text-slate-400 text-xs mt-1.5 space-y-1">
                    <li>No account creation or registration is required.</li>
                    <li>No name, email address, phone number, or physical location is gathered.</li>
                    <li>No device identifiers (IMEI, MAC address, Advertising ID) are tracked or transmitted.</li>
                    <li>No third-party advertising SDKs or behavioural tracking pixels are bundled.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-cyan-400 rounded-full" />
                    3. Device Permissions & Usage
                  </h3>
                  <div className="space-y-2 mt-1.5 text-xs text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <strong className="text-cyan-300">Haptics / Vibration:</strong> Used strictly for physical feedback during component interaction, switch toggles, and overload states.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <strong className="text-cyan-300">Audio Synthesizer:</strong> Plays procedural synthesis sounds (relays, audio oscillators, buzzer). Microphone permissions are NEVER requested.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <strong className="text-cyan-300">Canvas Snapshot / Storage:</strong> Allows you to download high-resolution schematic cards directly to your local device.
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-cyan-400 rounded-full" />
                    4. Children's Privacy (COPPA & GDPR Compliance)
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    Because ElectroLab is designed for STEM educational use, it conforms strictly to COPPA (Children's Online Privacy Protection Act) and GDPR-K standards. We do not gather personal data from minors or any other users.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-cyan-400 rounded-full" />
                    5. Contact Us
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    For inquiries regarding this privacy statement or ElectroLab development, contact us at:
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-xl w-fit">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span>sumits7196@gmail.com</span>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: Google Sites Guide */}
          {activeTab === 'google-sites' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-500/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>Google Sites Privacy Policy Connection</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Google Play Store & Google Console require a publicly accessible Privacy Policy URL. Hosting it for free on <strong>Google Sites</strong> is the easiest and most reliable method!
                </p>
                <button
                  onClick={handleOpenGoogleSites}
                  className="mt-3 flex items-center gap-2 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-cyan-500/20"
                >
                  <span>Open sites.google.com/new</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step by step guide */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-1">
                  How to publish in 3 simple steps:
                </h4>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-white">Create a New Site or Slide/Page</h5>
                    <p className="text-xs text-slate-400">
                      Open <code className="text-cyan-300">sites.google.com/new</code>. Click &quot;Blank site&quot;. Set title to <strong className="text-slate-200">ElectroLab Privacy Policy</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-white">Insert the Privacy Policy</h5>
                    <p className="text-xs text-slate-400">
                      Go to the right side menu: Click <strong className="text-slate-200">Insert &gt; Embed</strong> (or Text Box). Switch to the <strong>&quot;Embed code&quot;</strong> tab and paste our ready-made HTML, or paste the text directly.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-xs text-white">Publish and Copy Link</h5>
                    <p className="text-xs text-slate-400">
                      Click the purple/blue <strong className="text-slate-200">&quot;Publish&quot;</strong> button at top right. Set your web address (e.g. <code className="text-cyan-300">electrolab-privacy</code>). Copy the published URL and paste it into Google Play Console!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Embed HTML Code */}
          {activeTab === 'embed-code' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">Embeddable HTML Code</h4>
                  <p className="text-[11px] text-slate-400">
                    Paste this directly into Google Sites &gt; Insert &gt; Embed &gt; Embed code.
                  </p>
                </div>
                <button
                  onClick={handleCopyEmbed}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmbed ? 'Copied HTML!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[11px] text-slate-300 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{EMBED_HTML_CODE}</pre>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                <p>
                  <strong className="text-cyan-300">Also included in project:</strong> A standalone file is saved at{' '}
                  <code className="text-amber-300 font-mono">public/privacy-policy.html</code> which can be accessed directly on your web host or embedded in an iframe.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Copy plain policy text"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedText ? 'Copied Text!' : 'Copy Policy Text'}</span>
            </button>

            <button
              onClick={handleCopyEmbed}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
              title="Copy Google Sites embed HTML"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedEmbed ? 'Copied Embed Code!' : 'Copy Embed Code'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenGoogleSites}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-cyan-500/20"
            >
              <span>Google Sites</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
