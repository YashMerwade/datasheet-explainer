import { getServerSession } from 'next-auth';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await db
    .collection('users')
    .doc(session.user.email)
    .collection('conversations')
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get();

  const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return Response.json({ conversations });
}

export async function DELETE(req) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  await db
    .collection('users')
    .doc(session.user.email)
    .collection('conversations')
    .doc(id)
    .delete();

  return Response.json({ ok: true });
}
