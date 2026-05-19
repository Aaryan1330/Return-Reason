import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { ReviewStatus } from '@/types';

const ROLE_ALLOWED_FIELDS: Record<string, string[]> = {
  warehouse: ['sample_at_hq'],
  qc:        ['sample_required', 'sizes_to_order', 'sample_order_created', 'size_check', 'fit_trial_done', 'need_size_chart_updation', 'debit_note_raised', 'remarks', 'size_chart_update'],
  catalog:   ['description_updated', 'description_update_notes'],
  tech:      ['size_chart_updated'],
  admin:     ['*'],
};

function computeAutoStatus(row: any): ReviewStatus {
  const s = row.review_status as ReviewStatus;

  // QC: sample required AND order placed → send to warehouse
  if (s === 'qc' && row.sample_required === true && row.sample_order_created === true && row.sample_at_hq !== true) {
    return 'warehouse';
  }

  // Warehouse: sample received → send back to QC
  if (s === 'warehouse' && row.sample_at_hq === true) {
    return 'qc';
  }

  // QC complete (sample not required OR sample already at HQ) → catalog
  if (
    s === 'qc' &&
    row.sample_required !== null && row.sample_required !== undefined &&
    (row.sample_required === false || row.sample_at_hq === true) &&
    row.size_check === true &&
    row.fit_trial_done === true &&
    row.need_size_chart_updation !== null && row.need_size_chart_updation !== undefined &&
    row.debit_note_raised !== null && row.debit_note_raised !== undefined &&
    row.remarks && String(row.remarks).trim() !== ''
  ) {
    return 'catalog';
  }

  if (
    s === 'catalog' &&
    row.description_updated !== null && row.description_updated !== undefined &&
    (row.description_updated === false || (row.description_update_notes && String(row.description_update_notes).trim() !== ''))
  ) {
    return row.need_size_chart_updation === true ? 'tech' : 'completed';
  }

  if (s === 'tech' && row.size_chart_updated === true) {
    return 'completed';
  }

  return s;
}

// PATCH /api/skus/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const userId = (session.user as any).id;
  const userRole: string = (session.user as any).role ?? 'admin';

  try {
    const body = await request.json();

    const allowedFields = ROLE_ALLOWED_FIELDS[userRole] ?? [];
    const filteredBody: Record<string, unknown> = {};
    if (allowedFields[0] === '*') {
      Object.assign(filteredBody, body);
    } else {
      for (const field of allowedFields) {
        if (field in body) filteredBody[field] = body[field];
      }
    }

    const current = await pool.query('SELECT * FROM sku_reviews WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const currentRow = current.rows[0];

    const merged = { ...currentRow, ...filteredBody };

    const autoAdvanced = computeAutoStatus(merged);
    let finalStatus: ReviewStatus;
    if (
      userRole === 'admin' &&
      'review_status' in filteredBody &&
      filteredBody.review_status !== currentRow.review_status
    ) {
      finalStatus = filteredBody.review_status as ReviewStatus;
    } else {
      finalStatus = autoAdvanced;
    }

    await pool.query(
      `UPDATE sku_reviews SET
        sample_at_hq             = $1,
        sample_required          = $2,
        sizes_to_order           = $3,
        sample_order_created     = $4,
        size_check               = $5,
        fit_trial_done           = $6,
        size_issue_found         = $7,
        need_size_chart_updation = $8,
        size_chart_update        = $9,
        debit_note_raised        = $10,
        remarks                  = $11,
        description_updated      = $12,
        description_update_notes = $13,
        size_chart_updated       = $14,
        review_status            = $15,
        last_updated_by          = $16,
        last_updated_at          = NOW()
       WHERE id = $17`,
      [
        merged.sample_at_hq           ?? null,
        merged.sample_required         ?? null,
        merged.sizes_to_order ? JSON.stringify(merged.sizes_to_order) : null,
        merged.sample_order_created   ?? null,
        merged.size_check             ?? null,
        merged.fit_trial_done         ?? null,
        merged.size_issue_found       ?? null,
        merged.need_size_chart_updation ?? null,
        merged.size_chart_update ? JSON.stringify(merged.size_chart_update) : null,
        merged.debit_note_raised      ?? null,
        merged.remarks                ?? null,
        merged.description_updated    ?? null,
        merged.description_update_notes ?? null,
        merged.size_chart_updated     ?? null,
        finalStatus,
        userId,
        id,
      ]
    );

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
