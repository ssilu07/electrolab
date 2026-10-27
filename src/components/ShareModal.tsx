import React, { useState } from 'react';
import { CircuitComponent, CircuitWire } from '../types/circuit';
import { soundFX } from '../audio/SoundFX';
import { X, Copy, Check, Download, Upload, Share2, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  components: CircuitComponent[];
  wires: CircuitWire[];
  onLoadCircuit: (components: CircuitComponent[], wires: CircuitWire[]) => void;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  components,
  wires,
  onLoadCircuit,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
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
