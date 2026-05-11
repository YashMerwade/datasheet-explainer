import { getServerSession } from 'next-auth';
import { chatGroq } from '@/lib/groq';
import { db } from '@/lib/firebase-admin';

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, history, datasheetText, conversationId, datasheetName } = await req.json();

  // Use up to 8000 chars of the datasheet so the model has rich context
  const snippet = (datasheetText || '').trim().slice(0, 8000);
  const hasDatasheet = snippet.length > 50; // meaningful content threshold

  const systemPrompt = hasDatasheet
    ? `You are an expert electronics engineer AI assistant. The user has uploaded a datasheet file named "${datasheetName || 'unknown'}".

--- DATASHEET CONTENT (extracted text) ---
${snippet}
--- END OF DATASHEET ---

IMPORTANT RULES:
- You MUST answer based on the datasheet content above.
- Always identify the component by name from the content (e.g. NE555, LM358, ATmega328P, etc.).
- If the user asks "which component is this", read the datasheet text and name it.
- Give specific, accurate answers using the actual specs, pin numbers, voltages from the datasheet.
- Use bullet points and clear structure.
- Never say you don't have information when it's clearly in the datasheet text above.`
    : `You are an expert electronics engineer AI assistant. No datasheet has been uploaded yet.
Answer general electronics questions clearly. If the user asks about a specific component, answer from your knowledge.
Suggest uploading a datasheet PDF/DOCX/image for more specific help.`;

  const groqHistory = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const answer = await chatGroq(systemPrompt, groqHistory, 1500);

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
      await convRef.set({
        title: message.slice(0, 60),
        datasheetName: datasheetName || 'Unknown',
        createdAt: new Date().toISOString(),
        messages: [],
      });
    }

    await convRef.update({
      messages: [
        ...(convDoc.exists ? convDoc.data().messages : []),
        { role: 'user', content: message, ts: Date.now() },
        { role: 'assistant', content: answer, ts: Date.now() },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Firestore chat save error:', e);
  }

  return Response.json({ answer });
}
