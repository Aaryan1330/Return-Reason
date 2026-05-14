import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import pool from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const result = await pool.query(
            'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
            [credentials.email.toLowerCase().trim()]
          );

          const user = result.rows[0];
          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) return null;

          return {
            id:   user.id.toString(),
            email: user.email,
            name:  user.name,
            role:  user.role ?? 'admin',
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role ?? 'admin';
      } else if (token.id) {
        // Always refresh role from DB so stale JWTs pick up the current value
        const r = await pool.query('SELECT role FROM users WHERE id = $1', [token.id]);
        token.role = r.rows[0]?.role ?? 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id;
        (session.user as any).role = token.role ?? 'admin';
      }
      return session;
    },
  },
};
