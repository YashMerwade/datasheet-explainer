import { getServerSession } from 'next-auth';
import { chatGroq, callGroq } from '@/lib/groq';
import { db } from '@/lib/firebase-admin';

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, history, datasheetText, conversationId, datasheetName, attachedFile, useWebSearch } = await req.json();

  // --- Real-time Web Search ---
  let webSearchContext = '';
  if (useWebSearch) {
    try {
      const { search } = require('duck-duck-scrape');
      // Append 'India' to help localize searches like "price of IC"
      const searchQuery = message.toLowerCase().includes('india') ? message : `${message} in India`;
      const searchResults = await search(searchQuery, { safeSearch: "off", region: "in-en" });
      if (searchResults && searchResults.results && searchResults.results.length > 0) {
        webSearchContext = searchResults.results.slice(0, 10).map((r, i) => `[Web Result ${i+1}]: ${r.title}\n${r.description}\nExact URL to cite: ${r.url}`).join('\n\n');
      }
    } catch (e) {
      console.error("Web search failed:", e);
    }
  }

  // We will load the conversation to get persisted datasheetText if needed
  const userEmail = session.user.email;
  const convRef = db.collection('users').doc(userEmail).collection('conversations').doc(conversationId);
  const convDoc = await convRef.get();

  let finalDatasheetText = datasheetText || '';
  if (!finalDatasheetText && convDoc.exists) {
    finalDatasheetText = convDoc.data().datasheetText || '';
  }

  // --- Lightweight Keyword-based RAG ---
  function chunkText(text, chunkSize = 3000, overlap = 500) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize - overlap;
    }
    return chunks;
  }

  function getKeywords(text) {
    return new Set(text.toLowerCase().match(/\b[a-z0-9_]{3,}\b/g) || []);
  }

  let retrievedContext = '';
  if (finalDatasheetText.length > 50) {
    const chunks = chunkText(finalDatasheetText);
    const queryWords = Array.from(getKeywords(message));
    
    // Check if query is generic
    const isGeneric = queryWords.length < 4 && queryWords.some(w => ['explain', 'summarize', 'everything', 'pdf', 'overview', 'what', 'datasheet', 'this'].includes(w));

    if (isGeneric || chunks.length <= 3) {
      retrievedContext = chunks.slice(0, 3).join('\n\n...\n\n');
    } else {
      const scoredChunks = chunks.map((chunk, index) => {
        const chunkWords = getKeywords(chunk);
        let score = 0;
        for (const w of queryWords) {
          if (chunkWords.has(w)) score++;
        }
        if (index === 0) score += 0.5; // slight boost for intro/abstract
        return { chunk, score, index };
      });
      scoredChunks.sort((a, b) => b.score - a.score);
      const topChunks = scoredChunks.slice(0, 3).sort((a, b) => a.index - b.index);
      retrievedContext = topChunks.map(c => c.chunk).join('\n\n...\n\n');
    }
  }

  const visualOutputRules = `
VISUAL OUTPUT RULES (CRITICAL — read carefully, these are two DIFFERENT output types):

RULE 1 — IMAGE GENERATION (check this FIRST):
- IF the user's message contains ANY of these words/phrases: "image", "img", "picture", "photo", "illustration", "3D render", "render", "generate image", "generate img", "want image", "want img", "show image", "create image", "make image":
  → Identify the EXACT component name/part number (e.g. "NE555", "STM32F103", "LM7805") and package type (e.g. "DIP-8", "LQFP-48", "TO-220") from the datasheet context or chat history.
  → Generate a detailed, descriptive image prompt inside an \`\`\`image code block.
  → CRITICAL WRONG DETAILS/GIBBERISH TEXT WARNING: AI image generation models cannot render small text labels, lines, or technical callout labels correctly. They will output gibberish labels (such as "taftififte", "atl", "leval"). Therefore, your prompt MUST NOT ask for pin labels, text annotations, arrows, schematics, or pin callouts inside the image.
  → Instead, describe a clean, highly realistic 3D render or professional photograph of the physical component itself (e.g., placed on a green printed circuit board or a clean desk) with the EXACT part number clearly and crisply printed on the top plastic/metal surface of the component (e.g., "NE555" or "STM32F103C8T6" depending on the component in the current datasheet/context), and NO other text, no pointers, and no labels in the image.
  → Example:
    \`\`\`image
    A realistic, high-detail 3D macro photograph of an NE555 timer IC in a DIP-8 package, mounted on a green PCB with copper traces, the text 'NE555' printed in crisp white font on the top of the black plastic chip casing, no pin labels, no text callouts, no pointer lines, studio lighting, depth of field.
    \`\`\`
  → Do NOT generate a mermaid block when the user asks for an image/img/picture.

RULE 2 — MERMAID DIAGRAM (only if NOT an image request):
- IF the user asks for a "diagram", "architecture diagram", "block diagram", "flowchart", "system diagram", "pin diagram", "circuit diagram", "IC diagram", or "schematic" (and NOT an image/img/picture):
  → Generate a MERMAID diagram inside a \`\`\`mermaid code block.
  → MANDATORY QUALITY STANDARDS:
    1. USE SUBGRAPHS to group related components (e.g., "Power Management", "Communication Interfaces", "Timer/Counter", "Core", "Memory"). Always use \`subgraph\` blocks.
    2. USE STYLED NODES with descriptive labels. Use proper Mermaid node shapes:
       - Rectangle \`[Label]\` for standard blocks
       - Rounded \`(Label)\` for processes
       - Stadium \`([Label])\` for I/O
       - Diamond \`{Label}\` for decisions
       - Hexagon \`{{Label}}\` for important modules
       - Parallelogram \`[/Label/]\` for data
    3. USE \`classDef\` AND \`style\` for color coding:
       - Define color classes like: \`classDef core fill:#4f46e5,stroke:#3730a3,color:#fff,stroke-width:2px\`
       - Use distinct colors for different functional groups:
         • Core/CPU: Deep indigo (#4f46e5)
         • Memory: Emerald (#059669)
         • Power: Amber (#d97706)
         • Communication: Sky blue (#0284c7)
         • I/O & GPIO: Rose (#e11d48)
         • Timers/Peripherals: Purple (#7c3aed)
         • External components: Slate (#475569)
       - Apply classes: \`class NodeA,NodeB core\`
    4. USE MEANINGFUL EDGE LABELS with arrows like \`A -->|"AHB Bus"| B\` or \`A ---|"SPI"| B\`.
    5. PREFER \`flowchart TD\` (top-down) for architecture and \`flowchart LR\` (left-right) for signal flows.
    6. Include 15-30 nodes minimum for architecture diagrams. Don't make tiny 5-node diagrams.
    7. Use FULL descriptive names: "ARM Cortex-M3 Core" not "Core", "512KB Flash Memory" not "Flash", "UART1 Serial Interface" not "UART".
    8. Correct Mermaid syntax: \`A -->|label| B\` NOT \`-->|label|>\`.
    9. Group pins/peripherals logically by function.
    10. Add a brief title comment at the top: \`%% Architecture: [Component Name]\`
  → EXAMPLE PATTERN (follow this structure):
    \`\`\`mermaid
    flowchart TD
      subgraph CORE["🔷 Processor Core"]
        CPU["ARM Cortex-M3\\n32-bit @ 72MHz"]
        NVIC["Nested Vector\\nInterrupt Controller"]
      end
      subgraph MEM["🟢 Memory"]
        FLASH["64KB Flash\\nProgram Memory"]
        SRAM["20KB SRAM\\nData Memory"]
      end
      subgraph POWER["🟡 Power Management"]
        VREG["Voltage Regulator\\n2.0V - 3.6V"]
        POR["Power-On Reset"]
      end
      CPU -->|"Instruction Fetch"| FLASH
      CPU -->|"Data R/W"| SRAM
      VREG -->|"VDD"| CPU
      classDef core fill:#4f46e5,stroke:#3730a3,color:#fff,stroke-width:2px
      classDef mem fill:#059669,stroke:#047857,color:#fff,stroke-width:2px
      classDef pwr fill:#d97706,stroke:#b45309,color:#fff,stroke-width:2px
      class CPU,NVIC core
      class FLASH,SRAM mem
      class VREG,POR pwr
    \`\`\`

RULE 3 — NO VISUAL: If the user does NOT ask for an image OR a diagram, output ONLY text with tables. No visual blocks.`;

  const hasDatasheet = retrievedContext.length > 50;
  let basePrompt = '';
  if (hasDatasheet) {
    basePrompt = `You are an expert electronics engineering copilot with deep embedded systems knowledge.
The user has uploaded a datasheet named "${datasheetName || 'unknown'}".

--- RETRIEVED DATASHEET CONTEXT ---
${retrievedContext}
--- END CONTEXT ---

CORE RULES (apply ALWAYS):
1. DATASHEET-FIRST: Answer ONLY using information found in the datasheet context above. If the context does not mention something, say "The datasheet does not specify this" rather than inventing details from generic knowledge. Never claim a feature exists if it is not in the context.
2. NO UNNECESSARY FORMULAS: Include a formula ONLY when it is directly relevant to the user's question. Do NOT append unrelated formulas just to appear thorough. When you do use formulas, render them in LaTeX ($ inline, $$ block).
3. SPECIFICITY OVER GENERICISM: Give answers specific to THIS component's registers, timings, voltage ranges, and peripheral configurations. Avoid textbook-style overviews unless the user asks for beginner-level explanations.
4. NO REPETITION: Do NOT repeat the component name or "The STM32F103C8 microcontroller..." at the start of every sentence or paragraph. Vary your language naturally.
5. NO HALLUCINATED PERIPHERALS: Do NOT invent peripherals (e.g. internal EEPROM) if not confirmed in the datasheet context. State clearly if something is uncertain.
6. TABLES: Always use Markdown tables (| Col | Col |) for pin maps, register bits, specs comparisons, and electrical ratings.
7. STRUCTURE: Use ### headers to organize sections. Keep responses focused — do not pad.
8. CITATIONS: Naturally reference the datasheet — "According to Section X...", "The datasheet states...", "Based on the spec sheet..."

${visualOutputRules}`;
  } else if (datasheetName && datasheetName !== 'No file' && datasheetName !== 'Unknown') {
    basePrompt = `You are an expert electronics engineer.
The user uploaded a file named "${datasheetName}", but the backend could not extract readable text from it. It is likely a scanned image PDF, a diagram, or an unsupported format.
DO NOT say "You haven't uploaded a PDF".
Acknowledge that they uploaded "${datasheetName}", explain that you cannot read scanned images or textless PDFs, and suggest they upload a text-based PDF or manually describe the component so you can help from your expert knowledge.`;
  } else {
    basePrompt = `You are an expert electronics engineer. No datasheet has been uploaded yet.
Avoid generic electronics explanations unless asked. 
If the user asks about a specific component, answer from your expert knowledge.
Suggest uploading a datasheet PDF/DOCX/image for more specific help.

${visualOutputRules}`;
  }

  const systemPrompt = `${webSearchContext ? `--- REAL-TIME WEB SEARCH RESULTS ---\n${webSearchContext}\n--- END OF WEB SEARCH RESULTS ---\n\nCRITICAL ANTI-HALLUCINATION RULE FOR URLs:\nYou must use the above search results to answer the user. If the user asks for buying links (like Amazon or Flipkart), you MUST ONLY provide links that appear exactly in the "Exact URL to cite" fields above. \nIF NO EXACT URL IS PROVIDED FOR AMAZON/FLIPKART ABOVE, YOU MUST REPLY: "I could not find a direct link for that store in my search results." \nUNDER NO CIRCUMSTANCES are you allowed to guess, generate, or format a URL yourself (e.g. do NOT write fake URLs like amazon.com/dp/...). This is strictly forbidden.\n\n` : ''}${basePrompt}

EQUATIONS (LATEX): Format mathematical formulas using LaTeX — $ for inline math, $$ for block equations. Only include equations when they are directly relevant to the question.`;

  const groqHistory = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  let answer = await chatGroq(systemPrompt, groqHistory, 1500);
  
  // Forcefully strip out hallucinated Amazon/Flipkart links that aren't in the live search results
  if (useWebSearch && webSearchContext) {
    const storeRegex = /https?:\/\/(www\.)?(amazon|flipkart|ebay)\.[a-z.]+\/[^\s)]*/gi;
    answer = answer.replace(storeRegex, (url) => {
      // Remove trailing punctuation that might break the includes check
      const cleanUrl = url.replace(/[.,:;)]+$/, '').split('?')[0];
      if (!webSearchContext.includes(cleanUrl)) {
        return '*(Link redacted: The AI guessed this URL, but it is not a real live product link)*';
      }
      return url;
    });
  }
  
  answer = answer.trim();

  // Save conversation to Firestore
  try {
    const userEmail = session.user.email;
    const convRef = db
      .collection('users')
      .doc(userEmail)
      .collection('conversations')
      .doc(conversationId);

    const convDoc = await convRef.get();
    if (!convDoc.exists) {
      // Generate a smart, specific title using AI
      let smartTitle = message.slice(0, 60);
      try {
        const componentHint = datasheetName && datasheetName !== 'No file' && datasheetName !== 'Unknown'
          ? `The user uploaded a datasheet for: "${datasheetName}". `
          : '';
        const generatedTitle = await callGroq(
          'You are a conversation title generator. Generate a SHORT (4-7 words max), SPECIFIC, descriptive title for a conversation based on the user\'s first message and context. The title must be unique and capture the specific topic. Output ONLY the title — no quotes, no punctuation at the end, no explanation.',
          `${componentHint}User\'s first message: "${message}"\n\nGenerate a short specific title:`,
          30
        );
        if (generatedTitle && generatedTitle.trim().length > 2) {
          smartTitle = generatedTitle.trim().replace(/["'.]+$/, '').slice(0, 70);
        }
      } catch (e) {
        console.error('Title generation failed:', e);
      }

      await convRef.set({
        title: smartTitle,
        datasheetName: datasheetName || 'Unknown',
        datasheetText: finalDatasheetText,
        createdAt: new Date().toISOString(),
        messages: [],
      });
    } else if (!convDoc.data().datasheetText && finalDatasheetText) {
      await convRef.update({ datasheetText: finalDatasheetText });
    }

    await convRef.update({
      messages: [
        ...(convDoc.exists ? convDoc.data().messages : []),
        { role: 'user', content: message, ts: Date.now(), ...(attachedFile && { file: attachedFile }) },
        { role: 'assistant', content: answer, ts: Date.now() },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Firestore chat save error:', e);
  }

  return Response.json({ answer });
}
