import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

const VALID_ROLES = ['admin', 'warehouse', 'qc', 'catalog', 'tech'];

// POST /api/users — create a new team member account
// Accepts INTERNAL_API_KEY (for initial setup) or authenticated session
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const session = await getServerSession(authOptions);

  if (apiKey !== process.env.INTERNAL_API_KEY && !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'email, password, and name are all required' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const assignedRole = VALID_ROLES.includes(role) ? role : 'admin';
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase().trim(), passwordHash, name.trim(), assignedRole]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('POST /api/users:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
