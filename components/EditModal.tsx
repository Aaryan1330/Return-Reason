'use client';

import { useEffect, useState } from 'react';
import { SkuReview, ReviewStatus } from '@/types';

interface Props {
  sku: SkuReview;
  saving: boolean;
  onClose: () => void;
  onSave: (id: number, data: Partial<SkuReview>) => Promise<void>;
}

type BoolVal = boolean | null;

// Conditional formatting thresholds
function sizeColor(value: number | null): string {
  if (value === null || value === undefined) return 'bg-gray-100 text-gray-400';
  if (value < 7) return 'bg-green-100 text-green-700';
  if (value <= 15) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

const REGULAR_SIZES: { key: keyof SkuReview; label: string }[] = [
  { key: 'xs_return', label: 'XS' },
  { key: 's_return', label: 'S' },
  { key: 'm_return', label: 'M' },
  { key: 'l_return', label: 'L' },
  { key: 'xl_return', label: 'XL' },
  { key: 'xxl_return', label: 'XXL' },
];

const PLUS_SIZES: { key: keyof SkuReview; label: string }[] = [
  { key: 'xl3_return', label: '3XL' },
  { key: 'xl4_return', label: '4XL' },
  { key: 'xl5_return', label: '5XL' },
  { key: 'xl6_return', label: '6XL' },
];

function YesNoToggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: BoolVal;
  onChange: (v: BoolVal) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`w-20 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
            value === true
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600'
          }`}
        >
          ✓ Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`w-20 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
            value === false
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-500 border-gray-200 hover:border-red-400 hover:text-red-500'
          }`}
        >
          ✗ No
        </button>
      </div>
    </div>
  );
}

export default function EditModal({ sku, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    size_check: sku.size_check,
    size_issue_found: sku.size_issue_found,
    fit_trial_done: sku.fit_trial_done,
    debit_note_raised: sku.debit_note_raised,
    remarks: sku.remarks ?? '',
    description_updated: sku.description_updated,
    description_update_notes: sku.description_update_notes ?? '',
    review_status: sku.review_status,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (field: string) => (v: unknown) =>
    setForm((prev) => ({ ...prev, [field]: v }));

  const isPlus = sku.l1_category === 'plus';
  const sizes = isPlus ? PLUS_SIZES : REGULAR_SIZES;
  const hasSizeData = sizes.some((s) => sku[s.key] !== null && sku[s.key] !== undefined);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 p-5 border-b border-gray-100">
          {sku.image_url ? (
            <img
              src={sku.image_url}
              alt={sku.sku_group}
              className="object-cover rounded-xl bg-gray-100 flex-shrink-0"
              style={{ width: 60, height: 76 }}
            />
          ) : (
            <div className="rounded-xl bg-gray-100 flex-shrink-0" style={{ width: 60, height: 76 }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-bold text-gray-900 truncate">{sku.sku_group}</h2>
              {isPlus && (
                <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Plus Size
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{sku.category ?? '—'}</p>
            {sku.vendor && <p className="text-gray-400 text-xs mt-0.5">{sku.vendor}</p>}
            <div className="flex gap-4 mt-1.5 text-sm">
              <span className="font-semibold text-red-600">
                Returns: {sku.return_pct != null ? `${sku.return_pct}%` : 'N/A'}
              </span>
              <span className="text-gray-500">
                Online: {sku.online_inventory?.toLocaleString() ?? 'N/A'}
              </span>
              {sku.total_inventory != null && (
                <span className="text-gray-400">
                  Total: {sku.total_inventory.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 text-3xl leading-none flex-shrink-0 -mt-1"
          >
            ×
          </button>
        </div>

        <form onSubmit={async (e) => { e.preventDefault(); await onSave(sku.id, form); }}>
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* ── Size-wise Returns ── */}
            {hasSizeData && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Size-wise Return %
                  <span className="ml-2 font-normal normal-case text-gray-300">
                    ({isPlus ? '3XL – 6XL' : 'XS – XXL'})
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(({ key, label }) => {
                    const val = sku[key] as number | null;
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center rounded-xl px-4 py-2.5 min-w-[56px] ${sizeColor(val)}`}
                      >
                        <span className="text-xs font-bold">{label}</span>
                        <span className="text-lg font-bold leading-tight">
                          {val != null ? `${val}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                    Below 7%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    7–15%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                    Above 15%
                  </span>
                </div>
              </div>
            )}

            {/* ── Status ── */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Review Status
              </label>
              <select
                value={form.review_status}
                onChange={(e) => set('review_status')(e.target.value as ReviewStatus)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
              >
                <option value="pending">Not Started</option>
                <option value="in_review">Under Review</option>
                <option value="action_taken">Action Taken</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            {/* ── Size & Fit ── */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Size &amp; Fit Checks
              </p>
              <YesNoToggle
                label="Size Check Done"
                hint="Has the size labelling been physically verified?"
                value={form.size_check}
                onChange={set('size_check')}
              />
              <YesNoToggle
                label="Size Issue Found"
                hint="Was a size discrepancy or problem identified?"
                value={form.size_issue_found}
                onChange={set('size_issue_found')}
              />
              <YesNoToggle
                label="Fit Trial Completed"
                hint="Was the garment physically tried on to check fit?"
                value={form.fit_trial_done}
                onChange={set('fit_trial_done')}
              />
            </div>

            {/* ── Actions ── */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Actions Taken
              </p>
              <YesNoToggle
                label="Debit Note Raised"
                hint="Has a debit note been raised for this SKU?"
                value={form.debit_note_raised}
                onChange={set('debit_note_raised')}
              />
              <YesNoToggle
                label="Description Updated"
                hint="Has the product description been updated online?"
                value={form.description_updated}
                onChange={set('description_updated')}
              />
              {form.description_updated === true && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    What was updated?
                  </label>
                  <textarea
                    value={form.description_update_notes}
                    onChange={(e) => set('description_update_notes')(e.target.value)}
                    placeholder="e.g. Updated size chart, changed fit to slim-fit…"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600 resize-none"
                  />
                </div>
              )}
            </div>

            {/* ── Remarks ── */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Remarks <span className="text-gray-300 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) => set('remarks')(e.target.value)}
                placeholder="Add observations, notes, or follow-up actions…"
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
