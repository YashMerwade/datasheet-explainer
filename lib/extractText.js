/**
 * extractText.js — Server-side file text extraction
 * Supports: PDF, DOCX, TXT/CSV, Images (JPG/PNG via Tesseract OCR)
 */

// Polyfill DOMMatrix for PDFjs-dist in Node.js serverless/Vercel environment
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
    static fromMatrix() { return new DOMMatrix(); }
    static fromFloat32Array() { return new DOMMatrix(); }
    static fromFloat64Array() { return new DOMMatrix(); }
    translate() { return this; }
    scale() { return this; }
    multiply() { return this; }
    inverse() { return this; }
    transformPoint(p) { return p; }
  };
}

/**
 * @param {File | Blob} file  – FormData file entry
 * @param {string} fileName   – original filename for MIME detection
 * @returns {Promise<string>} extracted text
 */
export async function extractText(file, fileName) {
  const name = (fileName || file.name || '').toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  // ── PDF ──────────────────────────────────────────────────────────
  if (name.endsWith('.pdf')) {
    const pdfParseModule = await import('pdf-parse');
    if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text || '';
    } else {
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const result = await pdfParse(buffer);
      return result.text || '';
    }
  }

  // ── DOCX ─────────────────────────────────────────────────────────
  if (name.endsWith('.docx')) {
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // ── Plain text / CSV / Markdown ──────────────────────────────────
  if (
    name.endsWith('.txt') ||
    name.endsWith('.csv') ||
    name.endsWith('.md') ||
    name.endsWith('.rtf')
  ) {
    return buffer.toString('utf-8');
  }

  // ── Images (JPG, PNG, WEBP, BMP, TIFF) via Tesseract OCR ─────────
  if (
    name.match(/\.(jpe?g|png|webp|bmp|tiff?)$/)
  ) {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const {
        data: { text },
      } = await worker.recognize(buffer);
      await worker.terminate();
      return text || '';
    } catch (e) {
      console.error('OCR failed:', e);
      return '[Image uploaded — OCR failed. Please describe the component manually.]';
    }
  }

  return '[Unsupported file type. Please upload a PDF, DOCX, TXT, or image.]';
}
