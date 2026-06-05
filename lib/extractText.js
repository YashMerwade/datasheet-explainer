/**
 * extractText.js — Server-side file text extraction
 * Supports: PDF, DOCX, TXT/CSV, Images (JPG/PNG via Tesseract OCR)
 *
 * Uses pdfjs-dist directly (NOT pdf-parse) for reliable PDF parsing
 * on Vercel serverless without native canvas/DOMMatrix issues.
 */

/**
 * Parse a PDF buffer using pdfjs-dist's legacy build (no worker, no canvas).
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function parsePdfBuffer(buffer) {
  // Use the legacy build which doesn't require worker threads or canvas
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  // Explicitly import the worker file so Next.js/Vercel bundles it
  await import('pdfjs-dist/legacy/build/pdf.worker.mjs');

  // Disable the worker (we're in a serverless function, not a browser)
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    // Don't try to load a worker
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  const doc = await loadingTask.promise;
  const totalPages = doc.numPages;
  const pageTexts = [];

  for (let i = 1; i <= totalPages; i++) {
    try {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let lastY = null;
      let lineText = '';

      for (const item of content.items) {
        if (item.str === undefined) continue;
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
          lineText += '\n';
        }
        lineText += item.str;
        lastY = item.transform[5];
      }

      pageTexts.push(lineText);
    } catch (pageErr) {
      console.error(`Error extracting page ${i}:`, pageErr.message);
      pageTexts.push('');
    }
  }

  doc.destroy();
  return pageTexts.join('\n\n');
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
    try {
      const text = await parsePdfBuffer(buffer);
      if (text && text.trim().length > 0) {
        return text;
      }
      // If PDF returned empty text, it might be a scanned/image PDF
      return '[This PDF appears to be scanned or image-based — no selectable text was found. Please upload a text-based PDF or describe the component manually.]';
    } catch (err) {
      console.error('PDF extraction error:', err);
      throw new Error(`PDF parsing failed: ${err.message}`);
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
