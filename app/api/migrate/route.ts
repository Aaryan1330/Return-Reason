import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/migrate
 * Adds new columns to sku_reviews for the repeat/size-return expansion.
 * Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const migrations = [
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'weekly'`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS l1_category VARCHAR(50)`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS vendor VARCHAR(255)`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS total_inventory INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xs_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS s_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS m_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS l_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xxl_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl3_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl4_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl5_return INTEGER`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl6_return INTEGER`,
    `CREATE INDEX IF NOT EXISTS idx_sku_reviews_type ON sku_reviews(type)`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS size_chart_update JSONB`,
  ];

  try {
    for (const sql of migrations) {
      await pool.query(sql);
    }
    return NextResponse.json({ success: true, message: 'Migration completed successfully' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: 'Migration failed', detail: String(err) }, { status: 500 });
  }
}
