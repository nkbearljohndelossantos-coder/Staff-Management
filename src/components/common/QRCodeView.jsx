import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/**
 * QRCodeView component
 * High-resolution, offline-first 2D QR code generator on HTML5 Canvas.
 */
export default function QRCodeView({
  value,
  size = 160,
  errorCorrectionLevel = 'M',
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        String(value),
        {
          width: size,
          margin: 1,
          color: {
            dark: darkColor,
            light: lightColor
          },
          errorCorrectionLevel
        },
        (error) => {
          if (error) console.warn('QR Code generation error:', error);
        }
      );
    }
  }, [value, size, darkColor, lightColor, errorCorrectionLevel]);

  if (!value) return null;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <canvas ref={canvasRef} className="rounded-xl shadow-xs border border-slate-200/60 max-w-full" />
    </div>
  );
}
