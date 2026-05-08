import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

// PATCH /api/skus/[id] — save production team's review inputs
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const userId = (session.user as any).id;

  try {
    const {
      size_check,
      size_issue_found,
      fit_trial_done,
      debit_note_raised,
      remarks,
      description_updated,
      description_update_notes,
      review_status,
      size_chart_update,
    } = await request.json();

    const valid = [
      'pending', 'sample_ordered', 'sample_at_hq',
      'under_qc', 'qc_done',
      'under_catalog', 'catalog_done',
      'size_chart_revision', 'complete',
    ];
    if (review_status && !valid.includes(review_status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE sku_reviews SET
        size_check               = $1,
        size_issue_found         = $2,
        fit_trial_done           = $3,
        debit_note_raised        = $4,
        remarks                  = $5,
        description_updated      = $6,
        description_update_notes = $7,
        review_status            = $8,
        size_chart_update        = $9,
        last_updated_by          = $10,
        last_updated_at          = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        size_check ?? null,
        size_issue_found ?? null,
        fit_trial_done ?? null,
        debit_note_raised ?? null,
        remarks ?? null,
        description_updated ?? null,
        description_update_notes ?? null,
        review_status ?? 'pending',
        size_chart_update ? JSON.stringify(size_chart_update) : null,
        userId,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const full = await pool.query(
      `SELECT sr.*, u.name AS last_updated_by_name
       FROM sku_reviews sr
       LEFT JOIN users u ON sr.last_updated_by = u.id
       WHERE sr.id = $1`,
      [id]
    );

    return NextResponse.json(full.rows[0]);
  } catch (err) {
    console.error('PATCH /api/skus/[id]:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
