import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * POST /api/init
 * One-time setup: creates DB tables and optionally an initial admin user.
 * Protected by INTERNAL_API_KEY.
 *
 * Body (optional):
 *   { "email": "admin@snitch.com", "password": "secret", "name": "Admin" }
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name          VARCHAR(255) NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sku_reviews (
        id                       SERIAL PRIMARY KEY,
        sku_group                VARCHAR(255) NOT NULL,
        category                 VARCHAR(255),
        return_pct               DECIMAL(5,2),
        online_inventory         INTEGER,
        image_url                TEXT,
        week_date                DATE NOT NULL DEFAULT CURRENT_DATE,
        size_check               BOOLEAN DEFAULT NULL,
        size_issue_found         BOOLEAN DEFAULT NULL,
        fit_trial_done           BOOLEAN DEFAULT NULL,
        debit_note_raised        BOOLEAN DEFAULT NULL,
        remarks                  TEXT DEFAULT NULL,
        description_updated      BOOLEAN DEFAULT NULL,
        description_update_notes TEXT DEFAULT NULL,
        review_status            VARCHAR(50) NOT NULL DEFAULT 'pending',
        last_updated_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
        last_updated_at          TIMESTAMPTZ,
        created_at               TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sku_reviews_week_date ON sku_reviews(week_date);
      CREATE INDEX IF NOT EXISTS idx_sku_reviews_status    ON sku_reviews(review_status);
    `);

    let userCreated = false;
    try {
      const body = await request.json();
      if (body.email && body.password && body.name) {
        const hash = await bcrypt.hash(body.password, 12);
        await pool.query(
          `INSERT INTO users (email, password_hash, name)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO NOTHING`,
          [body.email.toLowerCase().trim(), hash, body.name.trim()]
        );
        userCreated = true;
      }
    } catch {
      // No body provided — that's fine
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialised successfully',
      userCreated,
    });
  } catch (err) {
    console.error('POST /api/init:', err);
    return NextResponse.json({ error: 'Initialisation failed' }, { status: 500 });
  }
}
