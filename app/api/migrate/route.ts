import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/migrate
 * Adds new columns and migrates status values. Safe to run multiple times.
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const migrations = [
    // Original columns
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

    // Workflow columns
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS sample_order_created BOOLEAN`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS sample_at_hq BOOLEAN`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS need_size_chart_updation BOOLEAN`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS size_chart_updated BOOLEAN`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS sample_required BOOLEAN`,

    // SKU-level fit metrics
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS size_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS size_too_small NUMERIC`,

    // Per-size fit metrics
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xs_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xs_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS s_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS s_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS m_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS m_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS l_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS l_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xxl_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xxl_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl3_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl3_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl4_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl4_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl5_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl5_too_small NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl6_too_big NUMERIC`,
    `ALTER TABLE sku_reviews ADD COLUMN IF NOT EXISTS xl6_too_small NUMERIC`,

    // Reset existing warehouse-status SKUs to qc (new default starting point)
    `UPDATE sku_reviews SET review_status = 'qc' WHERE review_status = 'warehouse' AND type = 'repeat'`,

    // Role on users
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'`,

    // Set correct roles for team accounts
    `UPDATE users SET role = 'warehouse' WHERE email = 'warehouse@snitch.com'`,
    `UPDATE users SET role = 'qc'        WHERE email = 'qc@snitch.com'`,
    `UPDATE users SET role = 'catalog'   WHERE email = 'catalog@snitch.com'`,
    `UPDATE users SET role = 'tech'      WHERE email = 'tech@snitch.com'`,

    // Migrate old 9-value status → new 5-value status
    `UPDATE sku_reviews SET review_status = 'warehouse' WHERE review_status IN ('pending','sample_ordered','sample_at_hq')`,
    `UPDATE sku_reviews SET review_status = 'qc'        WHERE review_status IN ('under_qc','qc_done')`,
    `UPDATE sku_reviews SET review_status = 'catalog'   WHERE review_status IN ('under_catalog','catalog_done')`,
    `UPDATE sku_reviews SET review_status = 'tech'      WHERE review_status = 'size_chart_revision'`,
    `UPDATE sku_reviews SET review_status = 'completed' WHERE review_status = 'complete'`,
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
