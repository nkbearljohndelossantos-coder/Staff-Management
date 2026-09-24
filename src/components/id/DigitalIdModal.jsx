import React, { useState, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  QrCode,
  ScanLine,
  ShieldCheck,
  Maximize2,
  Sparkles,
  Smartphone,
  ExternalLink,
  Share2,
  Info
} from 'lucide-react';
import BarcodeView from '../common/BarcodeView';
import QRCodeView from '../common/QRCodeView';
import QRCode from 'qrcode';

export default function DigitalIdModal({ staff, department, position, onClose }) {
  if (!staff) return null;

  const [copiedType, setCopiedType] = useState(null); // 'barcode' | 'qr' | 'all' | 'id'
  const [isScanMode, setIsScanMode] = useState(false);
  const cardRef = useRef(null);

  const employeeId = staff.employeeId || staff.id || 'NKB-STAFF';
  const barcodeValue = staff.barcodeValue || employeeId;
  const fullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Employee';
  const deptName = department?.name || staff.departmentName || 'Operations';
  const posTitle = position?.title || staff.positionTitle || 'Staff Member';
  const qrPayload = `NKB-STAFF:${employeeId}:${fullName.replace(/\s+/g, '_')}:AUTH-2026`;

  // Copy helper with feedback
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }).catch(err => {
      console.warn('Copy failed:', err);
    });
  };

  const handleCopyAll = () => {
    const text = [
      `NKB MANUFACTURING ENTERPRISE - DIGITAL EMPLOYEE ID`,
      `Name: ${fullName}`,
      `Employee ID: ${employeeId}`,
      `Position: ${posTitle}`,
      `Department: ${deptName}`,
      `Barcode Value: ${barcodeValue}`,
      `QR Payload: ${qrPayload}`,
      `Status: ACTIVE & VERIFIED`
    ].join('\n');
    handleCopy(text, 'all');
  };

  // Download high-resolution PNG image of the digital ID card
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1000);
    grad.addColorStop(0, '#020617'); // slate-950
    grad.addColorStop(0.3, '#0f172a'); // slate-900
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 700, 1000, 32);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.roundRect(0, 0, 700, 1000, 32);
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.roundRect(24, 24, 652, 90, 20);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.roundRect(24, 24, 652, 90, 20);
    ctx.stroke();

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NKB MANUFACTURING', 48, 65);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('OFFICIAL DIGITAL IDENTITY BADGE', 48, 92);

    // Verified Stamp
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('● VERIFIED PASS', 640, 75);

    // Photo Box / Placeholder
    ctx.fillStyle = '#1e293b';
    ctx.roundRect(260, 150, 180, 180, 24);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.roundRect(260, 150, 180, 180, 24);
    ctx.stroke();

    // Name & Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(fullName, 350, 380);

    ctx.fillStyle = '#38bdf8'; // light cyan
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(posTitle, 350, 415);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(deptName, 350, 445);

    // ID Pill
    ctx.fillStyle = '#0f172a';
    ctx.roundRect(200, 475, 300, 48, 24);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.roundRect(200, 475, 300, 48, 24);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`ID: ${employeeId}`, 350, 506);

    // White Card for Codes
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(40, 550, 620, 390, 24);
    ctx.fill();

    // Barcode & QR Label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`BARCODE & 2D SCANNER PASS`, 350, 585);

    // Render Barcode via Canvas
    const tempBarcodeCanvas = document.createElement('canvas');
    try {
      window.JsBarcode?.(tempBarcodeCanvas, barcodeValue, {
        format: 'CODE128',
        width: 2.2,
        height: 65,
        displayValue: true,
        fontSize: 16,
        font: 'monospace'
      });
      ctx.drawImage(tempBarcodeCanvas, (700 - tempBarcodeCanvas.width) / 2, 605);
    } catch {
      ctx.fillText(barcodeValue, 350, 670);
    }

    // Render QR Code via Canvas
    const tempQrCanvas = document.createElement('canvas');
    QRCode.toCanvas(tempQrCanvas, qrPayload, { width: 150, margin: 1 }, (err) => {
      if (!err) {
        ctx.drawImage(tempQrCanvas, 275, 730);
      }
      // Footer Security Notice
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Authorized for Plant Turnstiles, Canteen POS, and Kiosk Clock-In', 350, 915);

      // Trigger Download
      const link = document.createElement('a');
      link.download = `NKB_Digital_ID_${employeeId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <QrCode className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-xs font-black tracking-wide uppercase">Employee Digital ID & Pass</h3>
              <p className="text-[10px] text-slate-400">Barcode & 2D QR Code Ready</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsScanMode(!isScanMode)}
              className={`p-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                isScanMode
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
              title="Toggle Full Brightness Scanner Mode"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">{isScanMode ? 'Standard' : 'Scan Mode'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] space-y-5">
          
          {/* Printable & Visible Digital ID Badge */}
          <div
            id="printable-content"
            ref={cardRef}
            className={`w-full rounded-3xl overflow-hidden border transition-all ${
              isScanMode
                ? 'bg-white border-cyan-500 ring-4 ring-cyan-500/20 p-4 sm:p-6 text-slate-900 shadow-2xl'
                : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800 text-white p-5 sm:p-6 shadow-xl relative'
            }`}
          >
            {/* Holographic Security Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="/LogoC.png" alt="NKB Logo" className="h-6 w-6 object-contain drop-shadow" />
                <div>
                  <div className={`text-xs font-black tracking-widest uppercase ${isScanMode ? 'text-slate-950' : 'text-white'}`}>
                    NKB MANUFACTURING
                  </div>
                  <div className={`text-[9px] font-bold tracking-wider ${isScanMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    OFFICIAL ENTERPRISE ID
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> VERIFIED
                </span>
              </div>
            </div>

            {/* Profile Avatar & Staff Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 my-4 text-center sm:text-left">
              <div className="relative shrink-0">
                <img
                  src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-md bg-slate-800"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 text-cyan-400 border border-cyan-500/50 shadow-xs">
                  <Sparkles className="h-3 w-3" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h4 className={`text-lg sm:text-xl font-black tracking-tight truncate ${isScanMode ? 'text-slate-950' : 'text-white'}`}>
                  {fullName}
                </h4>
                <div className={`text-xs font-bold truncate mt-0.5 ${isScanMode ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {posTitle}
                </div>
                <div className={`text-[11px] truncate ${isScanMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {deptName}
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl border ${
                    isScanMode
                      ? 'bg-slate-100 text-slate-900 border-slate-300'
                      : 'bg-slate-900 text-white border-slate-700'
                  }`}>
                    {employeeId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(employeeId, 'id')}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                    title="Copy Employee ID"
                  >
                    {copiedType === 'id' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* DUAL CODES CARD: Barcode + 2D QR Code */}
            <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-md border border-slate-200 space-y-4">
              
              {/* 1. Barcode Representation */}
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1 px-1">
                  <span className="flex items-center gap-1 uppercase tracking-wider">
                    <ScanLine className="h-3 w-3 text-slate-700" /> Linear Barcode (Code 128)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(barcodeValue, 'barcode')}
                    className="text-cyan-600 hover:text-cyan-800 flex items-center gap-0.5 cursor-pointer font-bold"
                  >
                    {copiedType === 'barcode' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy Barcode
                      </>
                    )}
                  </button>
                </div>

                <div className="w-full bg-slate-50/80 rounded-xl p-2.5 border border-slate-200 flex flex-col items-center justify-center">
                  <BarcodeView
                    value={barcodeValue}
                    width={1.6}
                    height={46}
                    displayValue={false}
                  />
                  <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1">
                    {barcodeValue}
                  </span>
                </div>
              </div>

              {/* 2. 2D QR Code Representation */}
              <div className="flex flex-col items-center pt-3 border-t border-slate-100">
                <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2 px-1">
                  <span className="flex items-center gap-1 uppercase tracking-wider">
                    <QrCode className="h-3 w-3 text-slate-700" /> 2D Turnstile QR Pass
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(qrPayload, 'qr')}
                    className="text-cyan-600 hover:text-cyan-800 flex items-center gap-0.5 cursor-pointer font-bold"
                  >
                    {copiedType === 'qr' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy QR Data
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
                  <QRCodeView
                    value={qrPayload}
                    size={140}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 mt-1.5 font-mono">
                    Turnstile &amp; POS Verified Token
                  </span>
                </div>
              </div>
            </div>

            {/* Badge Footer */}
            <div className="mt-3.5 flex items-center justify-between text-[10px] px-1">
              <span className={`font-semibold ${isScanMode ? 'text-slate-500' : 'text-slate-400'}`}>
                PIN: <strong className={isScanMode ? 'text-slate-800' : 'text-white'}>{staff.pin || '12345678'}</strong>
              </span>
              <span className={`font-semibold ${isScanMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Role: <strong className="capitalize">{staff.role || 'Staff'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Copy & Export Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200"
            >
              {copiedType === 'all' ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4 text-slate-700" />
              )}
              <span className="text-[11px] font-extrabold">Copy All Info</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopy(barcodeValue, 'barcode')}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200"
            >
              <ScanLine className="h-4 w-4 text-slate-700" />
              <span className="text-[11px] font-extrabold">Copy Barcode</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span className="text-[11px] font-extrabold">Save Image</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer border border-slate-200"
            >
              <Printer className="h-4 w-4 text-slate-700" />
              <span className="text-[11px] font-extrabold">Print Badge</span>
            </button>
          </div>

          {/* Mobile Scanner Instructions Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5">
            <Smartphone className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-slate-900 font-bold block mb-0.5">Mobile Phone Scanning Tip:</strong>
              When scanning your digital badge at factory turnstiles or canteen POS scanners, tap <strong>Scan Mode</strong> above to max out contrast and screen visibility.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>NKB ID Security System</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
