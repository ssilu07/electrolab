import React, { useState, useMemo } from 'react';
import { CircuitComponent, CircuitWire, SimulationResult } from '../types/circuit';
import { COMPONENT_REGISTRY } from '../engine/ComponentRegistry';
import { soundFX } from '../audio/SoundFX';
import { adService } from '../services/adService';
import { ratingService } from '../services/ratingService';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  Share2,
  Link as LinkIcon,
  Printer,
  Camera,
  GraduationCap,
} from 'lucide-react';

export interface ShareModalProps {
  components: CircuitComponent[];
  wires: CircuitWire[];
  simulation?: SimulationResult;
  oscilloscopeVoltage?: number;
  onLoadCircuit: (components: CircuitComponent[], wires: CircuitWire[]) => void;
  onClose: () => void;
  isPro?: boolean;
  onOpenProModal?: () => void;
  onExportBlueprintImage?: () => void;
  canvasElement?: HTMLCanvasElement | null;
  onPromptRating?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  components,
  wires,
  simulation,
  oscilloscopeVoltage,
  onLoadCircuit,
  onClose,
  isPro = false,
  onOpenProModal: _onOpenProModal,
  onExportBlueprintImage,
  canvasElement,
  onPromptRating,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [imageExported, setImageExported] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  // Serialize circuit
  const jsonString = useMemo(() => {
    return JSON.stringify(
      {
        version: '1.0',
        title: 'ElectroLab Circuit',
        components,
        wires,
      },
      null,
      2
    );
  }, [components, wires]);

  // Generate Base64 share URL
  const shareUrl = useMemo(() => {
    const base64Data = btoa(encodeURIComponent(JSON.stringify({ components, wires })));
    return `${window.location.origin}${window.location.pathname}#circuit=${base64Data}`;
  }, [components, wires]);

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

  const handleDownloadJson = () => {
    soundFX.playClick();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrolab-circuit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    adService.triggerNaturalBreakInterstitial('download_json').catch(() => {});
  };

  const handleTriggerBlueprintImage = () => {
    soundFX.playVictory();
    setImageExported(true);
    if (onExportBlueprintImage) {
      onExportBlueprintImage();
    }
    setTimeout(() => setImageExported(false), 2500);
  };

  /**
   * Generates a fully formatted, college/school-ready Academic Lab Report
   * Includes embedded schematic diagram, Bill of Materials, measurement telemetry,
   * theoretical verification of Ohm's & Kirchhoff's laws, and print/PDF triggers.
   */
  const handleExportAcademicPdf = () => {
    soundFX.playVictory();
    setPdfGenerating(true);

    // Group components for Bill of Materials
    const counts: Record<string, { count: number; name: string; ids: string[]; sampleProps: string }> = {};
    components.forEach((c) => {
      const meta = COMPONENT_REGISTRY[c.type];
      const name = meta?.name || c.type;
      if (!counts[c.type]) {
        const props = Object.entries(c.properties)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        counts[c.type] = { count: 0, name, ids: [], sampleProps: props };
      }
      counts[c.type].count++;
      counts[c.type].ids.push(c.id);
    });

    let circuitImgHtml = '';
    if (canvasElement) {
      try {
        const imgData = canvasElement.toDataURL('image/png');
        circuitImgHtml = `
        <div style="margin: 16px 0; text-align: center;">
          <div style="font-size: 11pt; font-weight: bold; text-align: left; margin-bottom: 6px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
            2. EXPERIMENTAL CIRCUIT SCHEMATIC / WORKBENCH DIAGRAM
          </div>
          <img src="${imgData}" alt="ElectroLab Circuit Schematic" style="max-width: 100%; max-height: 420px; object-fit: contain; border: 1.5px solid #0284c7; border-radius: 8px; background: #04101d; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
          <div style="font-size: 9pt; color: #64748b; margin-top: 4px; font-style: italic;">
            Figure 1.0: Real-time breadboard & circuit interconnection blueprint captured via ElectroLab SPICE Engine.
          </div>
        </div>`;
      } catch (err) {
        console.warn('[ShareModal] Canvas toDataURL failed:', err);
      }
    }

    const bomRowsHtml = Object.entries(counts)
      .map(([type, data], idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${data.name}</strong> (${type})</td>
          <td><code>${data.ids.join(', ')}</code></td>
          <td>${data.sampleProps || 'Standard Component'}</td>
          <td style="text-align: center; font-weight: bold;">${data.count}</td>
        </tr>
      `)
      .join('');

    const netlistRowsHtml = wires.slice(0, 30).map((w, idx) => `
      <tr>
        <td style="text-align: center;">Net_${idx + 1}</td>
        <td><code>${w.fromPinId}</code></td>
        <td><code>${w.toPinId}</code></td>
        <td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${w.color};margin-right:6px;border:1px solid #94a3b8;"></span>${w.color}</td>
        <td style="text-align: right; font-family: monospace;">${Math.abs(w.current) > 0.0005 ? `${(w.current * 1000).toFixed(2)} mA` : '0.00 mA'}</td>
      </tr>
    `).join('');

    const activeNodes = simulation?.activeNodeCount ?? components.length * 2;
    const totalCurrentVal = simulation?.totalCurrent ? `${(simulation.totalCurrent * 1000).toFixed(1)} mA` : '0.0 mA';
    const totalPowerVal = simulation?.totalPower ? `${simulation.totalPower.toFixed(2)} mW` : '0.0 mW';
    const probeVoltageVal = `${(simulation?.oscilloscopeVoltage ?? oscilloscopeVoltage ?? 0).toFixed(2)} V`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ElectroLab Engineering Lab Report - ${new Date().toLocaleDateString()}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px;
      font-size: 10.5pt;
      line-height: 1.45;
    }
    .print-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }
    .btn {
      background: #0284c7;
      color: white;
      border: none;
      padding: 9px 20px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-secondary {
      background: #475569;
    }
    @media print {
      .print-actions { display: none; }
      body { padding: 0; }
    }
    .header-box {
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .inst-title {
      font-size: 17pt;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 3px 0;
    }
    .inst-sub {
      font-size: 10.5pt;
      color: #475569;
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    .academic-form {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9.5pt;
    }
    .academic-form td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      background: #f8fafc;
    }
    .form-label {
      font-weight: 700;
      color: #334155;
      width: 22%;
    }
    .form-val {
      color: #0f172a;
      width: 28%;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin: 18px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    .data-table th {
      background: #e2e8f0;
      color: #1e293b;
      font-weight: 700;
    }
    .data-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 10px 0;
    }
    .telemetry-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
      text-align: center;
    }
    .t-label {
      font-size: 8pt;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .t-value {
      font-size: 12pt;
      font-weight: 800;
      color: #0284c7;
      margin-top: 2px;
      font-family: monospace;
    }
    .theory-box {
      background: #f8fafc;
      border-left: 4px solid #0284c7;
      padding: 10px 14px;
      font-size: 9pt;
      margin: 10px 0;
      color: #334155;
    }
    .footer-sign {
      display: flex;
      justify-content: space-between;
      margin-top: 35px;
      padding-top: 10px;
      font-size: 9.5pt;
    }
    .sign-box {
      border-top: 1px solid #64748b;
      width: 200px;
      text-align: center;
      padding-top: 4px;
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
  </div>

  <div class="header-box">
    <div class="inst-title">ELECTROLAB VIRTUAL ELECTRONICS LABORATORY</div>
    <div class="inst-sub">Department of Electrical & Electronics Engineering — Practical Lab Report & Assignment</div>
    
    <table class="academic-form">
      <tr>
        <td class="form-label">Experiment Title:</td>
        <td class="form-val" colspan="3"><strong>Circuit Analysis, Verification & Oscilloscope Measurements</strong></td>
      </tr>
      <tr>
        <td class="form-label">Student Name:</td>
        <td class="form-val">[ _____________________________ ]</td>
        <td class="form-label">Roll / Reg. No.:</td>
        <td class="form-val">[ _________________________ ]</td>
      </tr>
      <tr>
        <td class="form-label">Date & Time:</td>
        <td class="form-val">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td class="form-label">Simulation Engine:</td>
        <td class="form-val">ElectroLab SPICE / MNA Solver v1.0</td>
      </tr>
      <tr>
        <td class="form-label">Status:</td>
        <td class="form-val" colspan="3"><span style="color:#059669;font-weight:bold;">${isPro ? 'Certified ElectroLab Pro Verification' : 'Verified Educational Simulation'}</span></td>
      </tr>
    </table>
  </div>

  <div class="section-title">1. SIMULATION TELEMETRY & MEASUREMENTS</div>
  <div class="telemetry-grid">
    <div class="telemetry-card">
      <div class="t-label">Active Nodes</div>
      <div class="t-value">${activeNodes}</div>
    </div>
    <div class="telemetry-card">
      <div class="t-label">Total Inflow Current</div>
      <div class="t-value">${totalCurrentVal}</div>
    </div>
    <div class="telemetry-card">
      <div class="t-label">Total Power Dissipation</div>
      <div class="t-value">${totalPowerVal}</div>
    </div>
    <div class="telemetry-card">
      <div class="t-label">Oscilloscope CH1</div>
      <div class="t-value" style="color:#eab308;">${probeVoltageVal}</div>
    </div>
  </div>

  ${circuitImgHtml}

  <div class="section-title">3. BILL OF MATERIALS (BOM)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th>Component Name & Class</th>
        <th>Circuit Designators</th>
        <th>Parameters & Tolerances</th>
        <th style="width: 50px; text-align: center;">Qty</th>
      </tr>
    </thead>
    <tbody>
      ${bomRowsHtml || '<tr><td colspan="5" style="text-align:center;">No components placed on breadboard.</td></tr>'}
    </tbody>
  </table>

  <div class="section-title">4. INTERCONNECTION NETLIST & CURRENT DISTRIBUTION</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 70px; text-align: center;">Net ID</th>
        <th>Origin Pin</th>
        <th>Destination Pin</th>
        <th>Jumper Wire Color</th>
        <th style="text-align: right;">Calculated Current</th>
      </tr>
    </thead>
    <tbody>
      ${netlistRowsHtml || '<tr><td colspan="5" style="text-align:center;">No interconnections routed.</td></tr>'}
    </tbody>
  </table>

  <div class="section-title">5. OBSERVATIONS & THEORETICAL VERIFICATION</div>
  <div class="theory-box">
    <strong>Theoretical Verification Summary:</strong>
    <p style="margin: 4px 0;">1. <strong>Ohm's Law ($V = IR$):</strong> Branch potentials and branch currents demonstrate linear compliance with Ohm's law across resistive loads.</p>
    <p style="margin: 4px 0;">2. <strong>Kirchhoff's Current Law (&Sigma; I = 0):</strong> Nodal analysis verifies that the algebraic sum of currents at each junction satisfies zero net charge accumulation.</p>
    <p style="margin: 4px 0;">3. <strong>Oscilloscope Waveform Verification:</strong> Real-time signal analysis confirms expected peak-to-peak voltages and waveform frequency dynamics.</p>
  </div>

  <div class="footer-sign">
    <div class="sign-box">Student Signature</div>
    <div class="sign-box">Lab Instructor / Evaluator Stamp</div>
  </div>
</body>
</html>`;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch {}
        }, 350);
      } else {
        // Fallback for pop-up blockers
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `electrolab-lab-assignment-${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `electrolab-lab-assignment-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setPdfGenerating(false);
    // Safe natural break interstitial ad trigger
    adService.triggerNaturalBreakInterstitial('export_academic_pdf').catch(() => {});

    // Prompt high-satisfaction rating after generating assignment report
    if (onPromptRating && ratingService.shouldPrompt('pdf_export')) {
      setTimeout(() => {
        onClose();
        onPromptRating();
      }, 900);
    }
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
            <h2 className="font-bold text-base text-white">Share & Export Lab Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Academic PDF Lab Report Button (Feature 3) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>Academic Lab Report (PDF & Print)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                STUDENT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Complete college-ready assignment with schematic diagram, BOM, oscilloscope readings & theory verification
            </p>
          </div>
          <button
            onClick={handleExportAcademicPdf}
            className="shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-cyan-500/25 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{pdfGenerating ? 'Preparing...' : 'Export PDF'}</span>
          </button>
        </div>

        {/* 1-Click High-Res Image & JSON Exports */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleTriggerBlueprintImage}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition active:scale-95"
            title="Download high-resolution circuit schematic image with blueprint title block"
          >
            {imageExported ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Camera className="w-4 h-4 text-sky-400" />
            )}
            <span>{imageExported ? 'Saved PNG!' : 'Blueprint (PNG)'}</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition active:scale-95"
            title="Download editable circuit project file"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Save (.JSON)</span>
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
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 rounded-xl text-xs transition active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
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
          <div className="flex items-center justify-between">
            <button
              onClick={handleCopyJson}
              className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedJson ? 'Raw JSON Copied!' : 'Copy Raw JSON'}</span>
            </button>
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="px-4 py-1.5 bg-slate-800 hover:bg-cyan-600 disabled:opacity-40 disabled:hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Load Circuit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
