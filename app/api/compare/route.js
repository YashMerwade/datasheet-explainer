import { getServerSession } from 'next-auth';
import { callGroq } from '@/lib/groq';
import { extractText } from '@/lib/extractText';

export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file1 = formData.get('pdf1');
  const file2 = formData.get('pdf2');

  if (!file1 || !file2) return Response.json({ error: 'Upload both files' }, { status: 400 });

  let t1 = '', t2 = '';
  try {
    [t1, t2] = await Promise.all([
      extractText(file1, file1.name),
      extractText(file2, file2.name),
    ]);
  } catch (err) {
    console.error('Text extraction error:', err);
    return Response.json({ error: 'Failed to extract text from files.' }, { status: 500 });
  }

  const prompt = `Compare these two electronic components:\n\nComponent A (${file1.name}):\n${t1.slice(0, 3000)}\n\nComponent B (${file2.name}):\n${t2.slice(0, 3000)}\n\nProvide: 1) Side-by-side spec comparison table 2) Key differences 3) Which is better for which use case 4) Final recommendation`;
  const result = await callGroq('You are an expert electronics engineer.', prompt, 1500);

  return Response.json({ result });
}
