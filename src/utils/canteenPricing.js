/**
 * Canteen Pricing & Box/Pack Breakdown Utilities
 * 
 * Manages Wholesale (Box/Pack) vs Retail (Single Piece) logic.
 * Ensures retail price per piece is always more expensive than the wholesale piece rate.
 */

const PACK_BOX_KEYWORDS = [
  'pack',
  'box',
  'sachet',
  'twin',
  'bundle',
  'case',
  'carton',
  'tray',
  'set',
  'dozen',
  'roll',
  'pair',
  'strip',
  'pouch'
];

/**
 * Determines if an item is a Box, Pack, Bundle, or Wholesale Multi-pack item
 * that qualifies for Wholesale vs Retail (Single Piece) pricing.
 */
export function isBoxOrPackItem(item) {
  if (!item) return false;
  
  if (
    Boolean(item.hasRetailPiece) || 
    Boolean(item.pieceBarcode) ||
    Number(item.retailPiecePrice) > 0 || 
    Boolean(item.isBoxOrPack) || 
    Boolean(item.isRetailPiece)
  ) {
    return true;
  }

  const u = (item.unit || '').toLowerCase();
  const s = (item.size || '').toLowerCase();
  const n = (item.name || '').toLowerCase();

  return PACK_BOX_KEYWORDS.some(kw => u.includes(kw) || s.includes(kw) || n.includes(kw));
}

/**
 * Extracts or estimates the number of pieces inside a Box, Pack, or Bundle.
 * Checks piecesPerPack field, and parses text patterns like:
 * - "twin pack", "twin" -> 2
 * - "2x195", "10x20g", "24x330ml" -> 2, 10, 24
 * - "pack of 6", "6-pack" -> 6
 * - "12 pcs", "10 sachets", "24 cans" -> 12, 10, 24
 */
export function extractPiecesFromItem(item) {
  if (!item) return 1;

  if (Number(item.piecesPerPack) > 0) {
    return parseInt(item.piecesPerPack, 10);
  }

  const n = (item.name || '').toLowerCase();
  const s = (item.size || '').toLowerCase();
  const u = (item.unit || '').toLowerCase();
  const combined = `${n} ${s} ${u}`;

  // Check for "twin"
  if (combined.includes('twin')) {
    return 2;
  }

  // Check for patterns like "2x195", "10x", "24x"
  const matchMultiplier = combined.match(/(\d+)\s*[xX]\s*\d*/);
  if (matchMultiplier && Number(matchMultiplier[1]) > 1) {
    return parseInt(matchMultiplier[1], 10);
  }

  // Check for "pack of 12", "box of 24"
  const matchPackOf = combined.match(/(?:pack|box|case|bundle|tray|set)\s+of\s+(\d+)/i);
  if (matchPackOf && Number(matchPackOf[1]) > 1) {
    return parseInt(matchPackOf[1], 10);
  }

  // Check for "12-pack", "6-pack"
  const matchHyphenPack = combined.match(/(\d+)\s*-\s*pack/i);
  if (matchHyphenPack && Number(matchHyphenPack[1]) > 1) {
    return parseInt(matchHyphenPack[1], 10);
  }

  // Check for "12pcs", "24 pcs", "10 sachets", "12 sticks", "24 cans"
  const matchUnits = combined.match(/(\d+)\s*(?:pcs|pc|pieces|sachets|sticks|cans|bottles|tabs|bars|packs)\b/i);
  if (matchUnits && Number(matchUnits[1]) > 1) {
    return parseInt(matchUnits[1], 10);
  }

  // Default to 1 if no explicit count found
  return 1;
}

/**
 * Calculates the effective retail price per single piece.
 * The retail price per piece is guaranteed to be more expensive than the wholesale price per piece.
 */
export function getEffectiveRetailPiecePrice(item) {
  if (!item) return 0;

  // If a retail price per piece has already been explicitly configured, honor it
  if (Number(item.retailPiecePrice) > 0) {
    return Number(item.retailPiecePrice);
  }

  const baseWholesale = Number(item.sellingPrice || item.unitPrice || item.wholesalePrice || 0);
  if (baseWholesale <= 0) return 0;

  const pieces = extractPiecesFromItem(item);

  if (pieces > 1) {
    const wholesalePerPiece = baseWholesale / pieces;
    // Retail piece price: +25% markup over wholesale rate per piece, rounded up
    const calculatedRetail = Math.ceil(wholesalePerPiece * 1.25);
    // Ensure it's strictly greater than wholesale rate per piece
    return calculatedRetail > wholesalePerPiece ? calculatedRetail : Math.ceil(wholesalePerPiece + 1);
  }

  // Single unit fallback: 20% retail premium
  return Math.ceil(baseWholesale * 1.20);
}

/**
 * Calculates wholesale base price for an item
 */
export function getEffectiveWholesalePrice(item) {
  if (!item) return 0;
  return Number(item.wholesalePrice || item.sellingPrice || item.unitPrice || 0);
}
