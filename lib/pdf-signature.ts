import type jsPDF from "jspdf";

/**
 * Fetches an image URL and returns a base64 data URL suitable for jsPDF.addImage.
 * Returns null if the fetch fails (so callers can gracefully skip).
 */
export async function fetchImageBase64(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const proxyUrl = url.replace(/^\/uploads\//, "/api/uploads/");
    const absoluteUrl = proxyUrl.startsWith("http") ? proxyUrl : `${window.location.origin}${proxyUrl}`;
    const response = await fetch(absoluteUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type SignatureStampOptions = {
  signatureImageUrl?: string | null;
  stampImageUrl?: string | null;
};

/**
 * Draw signature image and/or stamp image onto the PDF at the specified position.
 *
 * Layout strategy:
 * - Signature: 35mm wide × 15mm tall — compact, sits between "Hormat Kami," and the name.
 * - Stamp: 22mm × 22mm — small circle/square overlaid on the left side of signature area.
 *   Slightly overlaps signature to look natural (like a real stamped document).
 *
 * @param doc - jsPDF document
 * @param x - left X of signature zone
 * @param y - top Y (just below "Hormat Kami,")
 * @param signatureB64 - pre-fetched base64 of signature
 * @param stampB64 - pre-fetched base64 of stamp
 */
export function drawSignatureAndStamp(
  doc: jsPDF,
  x: number,
  y: number,
  signatureB64: string | null,
  stampB64: string | null,
) {
  // Signature: positioned centered in the gap between label and name.
  if (signatureB64) {
    try {
      doc.addImage(signatureB64, "AUTO", x + 5, y, 35, 15);
    } catch {
      // silently skip if image is corrupt
    }
  }

  // Stamp: overlaid on top-left of signature, slightly offset for natural look.
  if (stampB64) {
    try {
      doc.addImage(stampB64, "AUTO", x - 2, y - 2, 22, 22);
    } catch {
      // silently skip
    }
  }
}

/**
 * Pre-load both signature and stamp images in parallel.
 */
export async function preloadSignatureStamp(options: SignatureStampOptions) {
  const [signatureB64, stampB64] = await Promise.all([
    fetchImageBase64(options.signatureImageUrl),
    fetchImageBase64(options.stampImageUrl),
  ]);
  return { signatureB64, stampB64 };
}
