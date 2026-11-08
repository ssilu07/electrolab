import React, { useState } from 'react';
import { CircuitComponent, CircuitWire } from '../types/circuit';
import { COMPONENT_REGISTRY } from '../engine/ComponentRegistry';
import { soundFX } from '../audio/SoundFX';
import { X, Copy, Check, Download, Upload, Share2, Link as LinkIcon, FileText, Crown } from 'lucide-react';

interface ShareModalProps {
  components: CircuitComponent[];
  wires: CircuitWire[];
  onLoadCircuit: (components: CircuitComponent[], wires: CircuitWire[]) => void;
  onClose: () => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  components,
  wires,
  onLoadCircuit,
  onClose,
  isPro = false,
  onOpenProModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Serialize circuit
  const circuitData = {
    version: '1.0',
    title: 'ElectroCraft Circuit',
    created: new Date().toISOString(),
    components,
    wires,
  };

  const jsonString = JSON.stringify(circuitData, null, 2);

  // Generate Base64 share URL
  const base64Data = btoa(encodeURIComponent(JSON.stringify({ components, wires })));
  const shareUrl = `${window.location.origin}${window.location.pathname}#circuit=${base64Data}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      soundFX.playClick(1.3);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      soundFX.playClick(1.3);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    soundFX.playClick();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrocraft-circuit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLabReport = () => {
    if (!isPro) {
      soundFX.playClick();
      onOpenProModal?.();
      return;
    }
    soundFX.playVictory();

    // Group components for Bill of Materials
    const counts: Record<string, number> = {};
    components.forEach((c) => {
      const name = COMPONENT_REGISTRY[c.type]?.name || c.type;
      counts[name] = (counts[name] || 0) + 1;
    });

    const bomLines = Object.entries(counts)
      .map(([name, qty]) => `  - ${name.padEnd(35)} : Qty ${qty}`)
      .join('\n');

    const reportContent = `========================================================================
ELECTROLAB VIRTUAL WORKBENCH — ENGINEERING LAB REPORT
Generated: ${new Date().toLocaleString()}
Status: Certified ElectroLab Pro Document
========================================================================

1. CIRCUIT SUMMARY
   - Total Active Components: ${components.length}
   - Interconnection Wires:   ${wires.length}
   - Ground Reference:        ${components.some((c) => c.type === 'ground') ? 'Connected (0V Ref)' : 'Floating (No Ground)'}

2. BILL OF MATERIALS (BOM)
${bomLines || '  (No components placed)'}

3. INTERCONNECTION NETLIST
${wires.map((w, idx) => `  Net [${idx + 1}]: ${w.fromPinId.padEnd(20)} <---> ${w.toPinId} (Color: ${w.color})`).join('\n') || '  (No wires routed)'}

4. COMPONENT PARAMETER SPECS
${components.map((c) => {
  const meta = COMPONENT_REGISTRY[c.type];
  const props = Object.entries(c.properties)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  return `  - [${c.id}] ${meta?.name || c.type} @ (${c.x}, ${c.y}) [Rot: ${c.rotation}°] -> { ${props} }`;
}).join('\n')}

========================================================================
ElectroLab Simulation Engine &bullet; MNA Circuit Solver v1.0
========================================================================`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrolab-lab-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const handleImport = () => {
    try {
      setImportError('');
      let parsed = JSON.parse(importText);
      if (parsed.circuit) parsed = parsed.circuit;
      if (!Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
        throw new Error('Invalid circuit file: missing components or wires arrays.');
      }
      onLoadCircuit(parsed.components, parsed.wires);
      soundFX.playConnect();
      onClose();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg glass-modal rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col gap-4 font-sans text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-white">Share & Export Circuit</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Shareable Link */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5" />
            <span>1-Click Sharable URL</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-url-input"
              name="shareUrl"
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 glass-input rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-cyan-500/25 active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* File Export Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download .JSON</span>
          </button>
          <button
            onClick={handleCopyJson}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copiedJson ? 'JSON Copied!' : 'Copy JSON'}</span>
          </button>
        </div>

        {/* Pro Engineering Lab Report & BOM Export */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/20 via-slate-900 to-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Engineering Lab Report (BOM)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Export professional component Bill of Materials & Netlist specs for academic submission
            </p>
          </div>
          <button
            onClick={handleExportLabReport}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
              isPro
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/25'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-amber-500/25 active:scale-95'
            }`}
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </>
            ) : isPro ? (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5" />
                <span>Unlock (PRO)</span>
              </>
            )}
          </button>
        </div>

        {/* Import Circuit Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Circuit (Paste JSON)</span>
          </label>
          <textarea
            id="import-circuit-json"
            name="importCircuitJson"
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste exported circuit JSON here..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
          {importError && <span className="text-[11px] text-red-400 font-mono">{importError}</span>}
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="self-end px-4 py-1.5 bg-slate-800 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
          >
            Load Circuit
          </button>
        </div>
      </div>
    </div>
  );
};
