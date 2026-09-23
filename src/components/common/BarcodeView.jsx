import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * BarcodeView component
 * Renders Code 128 barcode using JsBarcode on an SVG element.
 */
export default function BarcodeView({
  value,
  width = 1.5,
  height = 40,
  displayValue = true,
  className = '',
  lineColor = '#000000',
  background = 'transparent'
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width,
          height,
          displayValue,
          font: 'monospace',
          fontSize: 12,
          textMargin: 3,
          lineColor,
          background,
          margin: 0
        });
      } catch (err) {
        console.error('Barcode rendering error:', err);
      }
    }
  }, [value, width, height, displayValue, lineColor, background]);

  if (!value) return null;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}
