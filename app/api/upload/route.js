import { getServerSession } from 'next-auth';
import { extractText } from '@/lib/extractText';

/**
 * POST /api/upload
 * Fast text extraction only — no Groq call.
 * Returns { text, fileName, chars }
 */
export async function POST(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  try {
    const text = await extractText(file, file.name);
    return Response.json({
      text,
      fileName: file.name,
      chars: text.length,
    });
  } catch (err) {
    console.error('Upload extraction error:', err);
    return Response.json({ error: 'Failed to extract text from file.', text: '' }, { status: 500 });
  }
}
