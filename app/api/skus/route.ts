import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// GET /api/skus
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const skuType = searchParams.get('type') ?? 'weekly';
  const week = searchParams.get('week');
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  const params: unknown[] = [];
  let idx = 1;
  let where = `WHERE sr.type = $${idx}`;
  params.push(skuType);
  idx++;

  if (skuType === 'weekly' && week) {
    const weekEnd = new Date(week + 'T00:00:00');
    weekEnd.setDate(weekEnd.getDate() + 7);
    where += ` AND sr.week_date >= $${idx} AND sr.week_date < $${idx + 1}`;
    params.push(week, weekEnd.toISOString().split('T')[0]);
    idx += 2;
  }
  if (status && status !== 'all') {
    where += ` AND sr.review_status = $${idx}`;
    params.push(status);
    idx++;
  }
  if (category && category !== 'all') {
    where += ` AND sr.category = $${idx}`;
    params.push(category);
  }

  try {
    const result = await pool.query(
      `SELECT sr.*, u.name AS last_updated_by_name
       FROM sku_reviews sr
       LEFT JOIN users u ON sr.last_updated_by = u.id
       ${where}
       ORDER BY sr.return_pct DESC NULLS LAST, sr.created_at DESC`,
      params
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('GET /api/skus:', err);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST /api/skus — called by backend with INTERNAL_API_KEY
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items: unknown[] = Array.isArray(body) ? body : [body];
    const inserted: unknown[] = [];

    for (const item of items as any[]) {
      const {
        sku_group, category, l1_category, vendor,
        return_pct, online_inventory, total_inventory,
        image_url, week_date, type,
        xs_return, s_return, m_return, l_return, xl_return, xxl_return,
        xl3_return, xl4_return, xl5_return, xl6_return,
      } = item;

      if (!sku_group) continue;

      const result = await pool.query(
        `INSERT INTO sku_reviews (
          sku_group, category, l1_category, vendor,
          return_pct, online_inventory, total_inventory,
          image_url, week_date, type,
          xs_return, s_return, m_return, l_return, xl_return, xxl_return,
          xl3_return, xl4_return, xl5_return, xl6_return
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
        ) RETURNING *`,
        [
          sku_group,
          category ?? null,
          l1_category ?? null,
          vendor || null,
          parseNum(typeof return_pct === 'string' ? return_pct.replace('%', '') : return_pct),
          parseNum(online_inventory),
          parseNum(total_inventory),
          image_url ?? null,
          week_date ?? getMondayOfWeek(),
          type ?? 'weekly',
          parseNum(xs_return), parseNum(s_return), parseNum(m_return),
          parseNum(l_return), parseNum(xl_return), parseNum(xxl_return),
          parseNum(xl3_return), parseNum(xl4_return), parseNum(xl5_return), parseNum(xl6_return),
        ]
      );
      inserted.push(result.rows[0]);
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error('POST /api/skus:', err);
    return NextResponse.json({ error: 'Failed to insert SKUs' }, { status: 500 });
  }
}
