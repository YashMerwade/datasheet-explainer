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
    systemPrompt = 'You are an electronics expert. Explain datasheets clearly for engineers and students.';
    userPrompt = `Analyze this datasheet and provide: 1) Component overview 2) Key specs 3) Pin functions 4) Typical use cases 5) Application tips.\n\nDatasheet:\n${snippet}`;
  } else if (mode === 'summary') {
    systemPrompt = 'You are an electronics expert. Give a concise summary.';
    userPrompt = `Give a 3-4 sentence quick overview of this component:\n\n${snippet}`;
  } else if (mode === 'related') {
    systemPrompt = 'You are an electronics expert.';
    userPrompt = `Based on this datasheet, suggest 5 related or alternative components with brief descriptions:\n\n${snippet}`;
  } else {
    systemPrompt = 'You are an electronics expert. Explain datasheets clearly.';
    userPrompt = `${mode}\n\nDocument content:\n${snippet}`;
  }

  const result = await callGroq(systemPrompt, userPrompt, 1500);
  return Response.json({ result, text });
}
