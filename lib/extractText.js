/**
 * extractText.js — Server-side file text extraction
 * Supports: PDF, DOCX, TXT/CSV, Images (JPG/PNG via Tesseract OCR)
 */

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
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const result = await pdfParse(buffer);
    return result.text || '';
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
