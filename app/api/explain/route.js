import { getServerSession } from 'next-auth';
import { callGroq } from '@/lib/groq';
import { extractText } from '@/lib/extractText';

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') || formData.get('pdf');
  const mode = formData.get('mode') || 'explain';

  if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 });

  let text = '';
  try {
    text = await extractText(file, file.name);
  } catch (err) {
    console.error('Text extraction error:', err);
    return Response.json({ error: 'Failed to extract text from file.' }, { status: 500 });
  }

  const snippet = text.slice(0, 6000);

  let systemPrompt, userPrompt;

  if (mode === 'explain') {
    systemPrompt = `You are an expert electronics engineering copilot. Analyze the uploaded datasheet strictly and accurately.

STRICT RULES:
1. DATASHEET-FIRST: Extract and report ONLY facts present in the datasheet text. Do NOT invent or assume peripherals, memory types, or features not explicitly mentioned. If unsure, say "Not specified in the provided datasheet excerpt."
2. NO HALLUCINATED SPECS: For example, do not claim "internal EEPROM" unless the datasheet text explicitly states it. Many STM32 variants do NOT have internal EEPROM.
3. TABLES: Format ALL pin listings, electrical ratings, and register maps as Markdown tables.
4. MERMAID ARCHITECTURE DIAGRAM: Generate a clean block diagram using a \`\`\`mermaid block with \`flowchart TD\` style. Use EXACT correct component names (e.g. "Cortex-M3 Core", "Flash Memory", "SRAM", "AHB Bus", "APB1 Bus", "APB2 Bus"). 
   - Correct arrow syntax: A -->|label| B  (NOT -->|label|>)
   - Do NOT use HTML. Only raw Mermaid code inside the block.
5. LaTeX EQUATIONS: Only include equations that are directly relevant. Use $ for inline math, $$ for block math.
6. NO PADDING: Keep responses focused. Do not repeat the component name excessively.`;
    userPrompt = `Analyze this datasheet and provide:\n1. Component Overview (2-3 sentences, specific to this IC)\n2. Key Electrical Specifications (table: Parameter | Value | Unit)\n3. Pin Configuration (table: Pin# | Name | Type | Function)\n4. Internal Architecture Block Diagram (Mermaid JS - correct labels, no hallucinations)\n5. Typical Applications (brief, datasheet-grounded)\n\nDatasheet text:\n${snippet}`;
  } else if (mode === 'summary') {
    systemPrompt = 'You are an expert electronics engineer. Give a concise, accurate summary based ONLY on the document text. Do not invent specs.';
    userPrompt = `Give a 3-4 sentence quick overview of this component based strictly on the text below:\n\n${snippet}`;
  } else if (mode === 'related') {
    systemPrompt = 'You are an expert electronics engineer.';
    userPrompt = `Based on this datasheet, suggest 5 related or alternative components with brief descriptions:\n\n${snippet}`;
  } else {
    systemPrompt = 'You are an electronics expert. Explain datasheets clearly and accurately. Do not hallucinate specs not present in the text.';
    userPrompt = `${mode}\n\nDocument content:\n${snippet}`;
  }

  const result = await callGroq(systemPrompt, userPrompt, 1500);
  return Response.json({ result, text });
}
