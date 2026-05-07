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
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{label}</p>
        {hint && <p className="text-sm text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`w-20 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
            value === true
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600'
          }`}
        >
          ✓ Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`w-20 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
            value === false
              ? 'bg-red-500 text-white border-red-500 shadow-sm'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(sku.id, form);
  };

  const set = (field: string) => (v: unknown) =>
    setForm((prev) => ({ ...prev, [field]: v }));

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 p-6 border-b border-gray-100">
          {sku.image_url ? (
            <img
              src={sku.image_url}
              alt={sku.sku_group}
              className="w-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
              style={{ height: '80px' }}
            />
          ) : (
            <div className="w-16 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{sku.sku_group}</h2>
            <p className="text-gray-500 text-sm">{sku.category ?? '—'}</p>
            <div className="flex gap-4 mt-1.5 text-sm">
              <span className="font-semibold text-red-600">
                Returns: {sku.return_pct != null ? `${sku.return_pct}%` : 'N/A'}
              </span>
              <span className="text-gray-500">
                Inventory: {sku.online_inventory?.toLocaleString() ?? 'N/A'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 text-3xl leading-none flex-shrink-0 -mt-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Review Status
              </label>
              <select
                value={form.review_status}
                onChange={(e) => set('review_status')(e.target.value as ReviewStatus)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
              >
                <option value="pending">Not Started</option>
                <option value="in_review">Under Review</option>
                <option value="action_taken">Action Taken</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            {/* Size & Fit */}
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

            {/* Actions */}
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
                    What was updated in the description?
                  </label>
                  <textarea
                    value={form.description_update_notes}
                    onChange={(e) => set('description_update_notes')(e.target.value)}
                    placeholder="e.g. Updated size chart, changed fit description to slim-fit…"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Remarks
                <span className="text-gray-400 font-normal normal-case ml-1">(optional)</span>
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) => set('remarks')(e.target.value)}
                placeholder="Add any observations, notes, or follow-up actions…"
                rows={3}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
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
              className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-700 active:bg-gray-950 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
