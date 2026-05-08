'use client';

import { useEffect, useState } from 'react';
import { SkuReview, ReviewStatus, SizeChartData } from '@/types';

interface Props {
  sku: SkuReview;
  saving: boolean;
  onClose: () => void;
  onSave: (id: number, data: Partial<SkuReview>) => Promise<void>;
}

type BoolVal = boolean | null;

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

// Size chart constants — sizes are ROWS, measurements are COLUMNS
const TOP_WEAR_SIZES    = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
const TOP_WEAR_MEAS     = ['Chest', 'Length', 'Shoulders', 'Sleeve'];
const BOTTOM_WEAR_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'];
const BOTTOM_WEAR_MEAS  = ['Hip', 'Inseam', 'Outseam', 'Waist'];

const BOTTOM_KEYWORDS = ['DENIM', 'JEAN', 'TROUSER', 'JOGGER', 'SHORT', 'CHINO', 'PANT', 'BOTTOM'];

function isBottomWear(category: string | null): boolean {
  if (!category) return false;
  const upper = category.toUpperCase();
  return BOTTOM_KEYWORDS.some((kw) => upper.includes(kw));
}

function buildEmptyChart(sizes: string[], measurements: string[]): SizeChartData {
  const chart: SizeChartData = {};
  for (const size of sizes) {
    chart[size] = {};
    for (const meas of measurements) {
      chart[size][meas] = '';
    }
  }
  return chart;
}

// Compute what status will be auto-advanced to on save (mirrors server logic)
function computeAutoStatus(
  status: ReviewStatus,
  size_check: BoolVal,
  fit_trial_done: BoolVal,
  size_issue_found: BoolVal,
  debit_note_raised: BoolVal,
  remarks: string,
): ReviewStatus | null {
  if (status === 'sample_at_hq') return 'under_qc';
  if (
    (status === 'under_qc' || status === 'qc_done') &&
    size_check === true &&
    fit_trial_done === true &&
    size_issue_found === false &&
    debit_note_raised !== null &&
    remarks.trim() !== ''
  ) return 'under_catalog';
  if (status === 'catalog_done') return 'size_chart_revision';
  return null;
}

const AUTO_STATUS_LABELS: Partial<Record<ReviewStatus, string>> = {
  under_qc:          'Under QC',
  under_catalog:     'Under Catalog Review',
  size_chart_revision: 'Size Chart Revision',
};

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

function SizeChartMatrix({
  sizes,
  measurements,
  data,
  onChange,
}: {
  sizes: string[];
  measurements: string[];
  data: SizeChartData;
  onChange: (d: SizeChartData) => void;
}) {
  const update = (size: string, meas: string, val: string) => {
    onChange({ ...data, [size]: { ...data[size], [meas]: val } });
  };

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 font-semibold text-gray-500 w-14"></th>
            {measurements.map((m) => (
              <th key={m} className="px-1 py-1.5 font-bold text-gray-700 text-center min-w-[70px]">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size} className="border-t border-gray-100">
              <td className="px-2 py-1 font-bold text-gray-700 whitespace-nowrap">{size}</td>
              {measurements.map((meas) => (
                <td key={meas} className="px-1 py-1">
                  <input
                    type="text"
                    value={data[size]?.[meas] ?? ''}
                    onChange={(e) => update(size, meas, e.target.value)}
                    placeholder="—"
                    className="w-full text-center border border-gray-200 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600 bg-white"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EditModal({ sku, saving, onClose, onSave }: Props) {
  const isPlus       = sku.l1_category === 'plus';
  const defaultBottom = isBottomWear(sku.category);
  const [garmentType, setGarmentType] = useState<'top' | 'bottom'>(defaultBottom ? 'bottom' : 'top');

  const chartSizes = garmentType === 'bottom' ? BOTTOM_WEAR_SIZES : TOP_WEAR_SIZES;
  const chartMeas  = garmentType === 'bottom' ? BOTTOM_WEAR_MEAS  : TOP_WEAR_MEAS;

  const initChart = (): SizeChartData => {
    if (sku.size_chart_update && Object.keys(sku.size_chart_update).length > 0) {
      return sku.size_chart_update as SizeChartData;
    }
    return buildEmptyChart(chartSizes, chartMeas);
  };

  const [form, setForm] = useState({
    size_check:               sku.size_check,
    fit_trial_done:           sku.fit_trial_done,
    size_issue_found:         sku.size_issue_found,
    debit_note_raised:        sku.debit_note_raised,
    remarks:                  sku.remarks ?? '',
    description_updated:      sku.description_updated,
    description_update_notes: sku.description_update_notes ?? '',
    review_status:            sku.review_status,
    size_chart_update:        initChart(),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (field: string) => (v: unknown) =>
    setForm((prev) => ({ ...prev, [field]: v }));

  const sizes = isPlus ? PLUS_SIZES : REGULAR_SIZES;
  const hasSizeData = sizes.some((s) => sku[s.key] !== null && sku[s.key] !== undefined);

  const autoStatus = computeAutoStatus(
    form.review_status,
    form.size_check,
    form.fit_trial_done,
    form.size_issue_found,
    form.debit_note_raised,
    form.remarks,
  );

  const handleChartChange = (d: SizeChartData) =>
    setForm((prev) => ({ ...prev, size_chart_update: d }));

  const handleGarmentTypeChange = (type: 'top' | 'bottom') => {
    setGarmentType(type);
    const newSizes = type === 'bottom' ? BOTTOM_WEAR_SIZES : TOP_WEAR_SIZES;
    const newMeas  = type === 'bottom' ? BOTTOM_WEAR_MEAS  : TOP_WEAR_MEAS;
    setForm((prev) => ({ ...prev, size_chart_update: buildEmptyChart(newSizes, newMeas) }));
  };

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
                <optgroup label="Warehouse">
                  <option value="pending">Not Started</option>
                  <option value="sample_ordered">Sample Order Created</option>
                  <option value="sample_at_hq">Sample at HQ</option>
                </optgroup>
                <optgroup label="QC">
                  <option value="under_qc">Under QC</option>
                  <option value="qc_done">QC Done</option>
                </optgroup>
                <optgroup label="Catalog">
                  <option value="under_catalog">Under Catalog Review</option>
                  <option value="catalog_done">Catalog Done</option>
                </optgroup>
                <optgroup label="Tech">
                  <option value="size_chart_revision">Size Chart Revision</option>
                  <option value="complete">Complete</option>
                </optgroup>
              </select>

              {/* Auto-advance banner */}
              {autoStatus && (
                <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm text-emerald-800">
                  <span className="text-base">→</span>
                  <span>
                    Saving will automatically advance status to{' '}
                    <strong>{AUTO_STATUS_LABELS[autoStatus]}</strong>
                  </span>
                </div>
              )}
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
                label="Fit Trial Completed"
                hint="Was the garment physically tried on to check fit?"
                value={form.fit_trial_done}
                onChange={set('fit_trial_done')}
              />
              <YesNoToggle
                label="Size Issue Found"
                hint="Was a size discrepancy or problem identified?"
                value={form.size_issue_found}
                onChange={set('size_issue_found')}
              />
            </div>

            {/* ── Size Chart Matrix (shown when size issue found = yes) ── */}
            {form.size_issue_found === true && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Size Chart Update
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleGarmentTypeChange('top')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        garmentType === 'top'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      Top Wear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGarmentTypeChange('bottom')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        garmentType === 'bottom'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                      }`}
                    >
                      Bottom Wear
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-500 mb-3">
                  Enter corrected measurements (cm) for each size.
                </p>
                <SizeChartMatrix
                  sizes={chartSizes}
                  measurements={chartMeas}
                  data={form.size_chart_update}
                  onChange={handleChartChange}
                />
              </div>
            )}

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
