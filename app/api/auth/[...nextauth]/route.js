import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/firebase-admin';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const ref = db.collection('users').doc(user.email);
        const doc = await ref.get();
        if (!doc.exists) {
          await ref.set({
            name: user.name,
            email: user.email,
            image: user.image,
            createdAt: new Date().toISOString(),
          });
        }
        return true;
      } catch (e) {
        console.error('Firestore signIn error:', e);
        return true;
      }
    },
    async session({ session }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };
