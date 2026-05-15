'use client';

import { useEffect, useState } from 'react';
import { SkuReview, ReviewStatus, SizeChartData, UserRole } from '@/types';

interface Props {
  sku:      SkuReview;
  saving:   boolean;
  userRole: UserRole;
  onClose:  () => void;
  onSave:   (id: number, data: Partial<SkuReview>) => Promise<void>;
}

type BoolVal = boolean | null;

// ─── Size chart ───────────────────────────────────────────────────────────────

const TOP_WEAR_SIZES    = ['XS','S','M','L','XL','XXL','3XL','4XL','5XL','6XL'];
const TOP_WEAR_MEAS     = ['Chest','Length','Shoulders','Sleeve'];
const BOTTOM_WEAR_SIZES = ['28','30','32','34','36','38','40','42','44','46','48','50'];
const BOTTOM_WEAR_MEAS  = ['Hip','Inseam','Outseam','Waist'];
const BOTTOM_KEYWORDS   = ['DENIM','JEAN','TROUSER','JOGGER','SHORT','CHINO','PANT','BOTTOM'];

function isBottomWear(cat: string | null) {
  if (!cat) return false;
  return BOTTOM_KEYWORDS.some((k) => cat.toUpperCase().includes(k));
}

function buildEmptyChart(sizes: string[], meas: string[]): SizeChartData {
  const c: SizeChartData = {};
  for (const s of sizes) { c[s] = {}; for (const m of meas) c[s][m] = ''; }
  return c;
}

// ─── Size data per size ───────────────────────────────────────────────────────

type SizeEntry = {
  label: string;
  returnKey: keyof SkuReview;
  tooBigKey: keyof SkuReview;
  tooSmallKey: keyof SkuReview;
};

const REGULAR_SIZES: SizeEntry[] = [
  { label: 'XS',  returnKey: 'xs_return',  tooBigKey: 'xs_too_big',  tooSmallKey: 'xs_too_small' },
  { label: 'S',   returnKey: 's_return',   tooBigKey: 's_too_big',   tooSmallKey: 's_too_small' },
  { label: 'M',   returnKey: 'm_return',   tooBigKey: 'm_too_big',   tooSmallKey: 'm_too_small' },
  { label: 'L',   returnKey: 'l_return',   tooBigKey: 'l_too_big',   tooSmallKey: 'l_too_small' },
  { label: 'XL',  returnKey: 'xl_return',  tooBigKey: 'xl_too_big',  tooSmallKey: 'xl_too_small' },
  { label: 'XXL', returnKey: 'xxl_return', tooBigKey: 'xxl_too_big', tooSmallKey: 'xxl_too_small' },
];

const PLUS_SIZES: SizeEntry[] = [
  { label: '3XL', returnKey: 'xl3_return', tooBigKey: 'xl3_too_big', tooSmallKey: 'xl3_too_small' },
  { label: '4XL', returnKey: 'xl4_return', tooBigKey: 'xl4_too_big', tooSmallKey: 'xl4_too_small' },
  { label: '5XL', returnKey: 'xl5_return', tooBigKey: 'xl5_too_big', tooSmallKey: 'xl5_too_small' },
  { label: '6XL', returnKey: 'xl6_return', tooBigKey: 'xl6_too_big', tooSmallKey: 'xl6_too_small' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckboxRow({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center gap-3 py-3.5 border-b border-gray-100 last:border-0 cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
      }`}>
        {checked && <span className="text-white text-xs font-bold leading-none">✓</span>}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function YesNoToggle({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: BoolVal; onChange: (v: BoolVal) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button type="button" onClick={() => onChange(value === true ? null : true)}
          className={`w-20 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
            value === true ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600'
          }`}>✓ Yes</button>
        <button type="button" onClick={() => onChange(value === false ? null : false)}
          className={`w-20 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
            value === false ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-500 border-gray-200 hover:border-red-400 hover:text-red-500'
          }`}>✗ No</button>
      </div>
    </div>
  );
}

function SizeChartMatrix({
  sizes, measurements, data, onChange,
}: { sizes: string[]; measurements: string[]; data: SizeChartData; onChange: (d: SizeChartData) => void }) {
  const update = (size: string, meas: string, val: string) =>
    onChange({ ...data, [size]: { ...data[size], [meas]: val } });
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 w-12"></th>
            {measurements.map((m) => (
              <th key={m} className="px-1 py-1.5 font-bold text-gray-700 text-center min-w-[70px]">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sizes.map((size) => (
            <tr key={size} className="border-t border-gray-100">
              <td className="px-2 py-1 font-bold text-gray-700 whitespace-nowrap">{size}</td>
              {measurements.map((meas) => (
                <td key={meas} className="px-1 py-1">
                  <input type="text" value={data[size]?.[meas] ?? ''} onChange={(e) => update(size, meas, e.target.value)}
                    placeholder="—"
                    className="w-full text-center border border-gray-200 rounded-lg px-1 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-600 bg-white" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Fit metrics cell ─────────────────────────────────────────────────────────

function FitBadge({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div className={`flex flex-col items-center rounded-lg px-2 py-1.5 min-w-[48px] ${color}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-sm font-bold leading-tight">{value != null ? `${value}%` : '—'}</span>
    </div>
  );
}

// ─── Auto-advance preview ─────────────────────────────────────────────────────

function computePreviewStatus(form: any, sku: SkuReview): ReviewStatus | null {
  const s = form.review_status as ReviewStatus;
  if (s === 'qc' && form.sample_required === true && sku.sample_at_hq !== true) return 'warehouse';
  if (s === 'warehouse' && form.sample_order_created && form.sample_at_hq) return 'qc';
  if (
    s === 'qc' &&
    form.sample_required !== null &&
    (form.sample_required === false || sku.sample_at_hq === true) &&
    form.size_check === true && form.fit_trial_done === true &&
    form.need_size_chart_updation !== null &&
    form.debit_note_raised !== null && form.remarks.trim() !== ''
  ) return 'catalog';
  if (
    s === 'catalog' &&
    form.description_updated !== null &&
    (form.description_updated === false || form.description_update_notes.trim() !== '')
  ) return sku.need_size_chart_updation === true ? 'tech' : 'completed';
  if (s === 'tech' && form.size_chart_updated) return 'completed';
  return null;
}

const STATUS_DISPLAY: Partial<Record<ReviewStatus, string>> = {
  warehouse: 'Warehouse', qc: 'QC', catalog: 'Catalog', tech: 'Tech', completed: 'Completed',
};

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function EditModal({ sku, saving, userRole, onClose, onSave }: Props) {
  const isPlus        = sku.l1_category === 'plus';
  const defaultBottom = isBottomWear(sku.category);
  const [garmentType, setGarmentType] = useState<'top'|'bottom'>(defaultBottom ? 'bottom' : 'top');

  const chartSizes = garmentType === 'bottom' ? BOTTOM_WEAR_SIZES : TOP_WEAR_SIZES;
  const chartMeas  = garmentType === 'bottom' ? BOTTOM_WEAR_MEAS  : TOP_WEAR_MEAS;

  const [form, setForm] = useState({
    // Warehouse
    sample_order_created:     sku.sample_order_created ?? false,
    sample_at_hq:             sku.sample_at_hq ?? false,
    // QC
    sample_required:          sku.sample_required ?? false,
    size_check:               sku.size_check,
    fit_trial_done:           sku.fit_trial_done,
    need_size_chart_updation: sku.need_size_chart_updation,
    size_chart_update:        (sku.size_chart_update && Object.keys(sku.size_chart_update).length > 0)
                                ? sku.size_chart_update as SizeChartData
                                : buildEmptyChart(chartSizes, chartMeas),
    debit_note_raised:        sku.debit_note_raised,
    remarks:                  sku.remarks ?? '',
    // Catalog
    description_updated:      sku.description_updated,
    description_update_notes: sku.description_update_notes ?? '',
    // Tech
    size_chart_updated:       sku.size_chart_updated ?? false,
    // Admin
    review_status:            sku.review_status,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (field: string) => (v: unknown) => setForm((prev) => ({ ...prev, [field]: v }));

  const handleGarmentTypeChange = (type: 'top'|'bottom') => {
    setGarmentType(type);
    const ns = type === 'bottom' ? BOTTOM_WEAR_SIZES : TOP_WEAR_SIZES;
    const nm = type === 'bottom' ? BOTTOM_WEAR_MEAS  : TOP_WEAR_MEAS;
    setForm((prev) => ({ ...prev, size_chart_update: buildEmptyChart(ns, nm) }));
  };

  const sizeSeries = isPlus ? PLUS_SIZES : REGULAR_SIZES;

  const autoStatus = userRole !== 'admin' ? computePreviewStatus(form, sku) : null;

  const showWarehouse = userRole === 'admin' || userRole === 'warehouse';
  const showQC        = userRole === 'admin' || userRole === 'qc';
  const showCatalog   = userRole === 'admin' || userRole === 'catalog';
  const showTech      = userRole === 'admin' || userRole === 'tech';

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 p-5 border-b border-gray-100">
          {sku.image_url ? (
            <img src={sku.image_url} alt={sku.sku_group}
              className="object-cover rounded-xl bg-gray-100 flex-shrink-0" style={{ width: 60, height: 76 }} />
          ) : (
            <div className="rounded-xl bg-gray-100 flex-shrink-0" style={{ width: 60, height: 76 }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-bold text-gray-900 truncate">{sku.sku_group}</h2>
              {isPlus && (
                <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">Plus Size</span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{sku.category ?? '—'}</p>
            {sku.vendor && <p className="text-gray-400 text-xs mt-0.5">{sku.vendor}</p>}
            <div className="flex flex-wrap gap-3 mt-1.5 text-sm">
              <span className="font-semibold text-red-600">Returns: {sku.return_pct != null ? `${sku.return_pct}%` : 'N/A'}</span>
              {sku.size_too_small != null && (
                <span className="font-semibold text-orange-500">Too Small: {sku.size_too_small}%</span>
              )}
              {sku.size_too_big != null && (
                <span className="font-semibold text-blue-500">Too Big: {sku.size_too_big}%</span>
              )}
              <span className="text-gray-500">Online: {sku.online_inventory?.toLocaleString() ?? 'N/A'}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-3xl leading-none flex-shrink-0 -mt-1">×</button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          let payload: Partial<SkuReview>;
          if (userRole === 'warehouse') {
            payload = { sample_order_created: form.sample_order_created, sample_at_hq: form.sample_at_hq };
          } else if (userRole === 'qc') {
            payload = { sample_required: form.sample_required, size_check: form.size_check, fit_trial_done: form.fit_trial_done, need_size_chart_updation: form.need_size_chart_updation, debit_note_raised: form.debit_note_raised, remarks: form.remarks, size_chart_update: form.size_chart_update };
          } else if (userRole === 'catalog') {
            payload = { description_updated: form.description_updated, description_update_notes: form.description_update_notes };
          } else if (userRole === 'tech') {
            payload = { size_chart_updated: form.size_chart_updated };
          } else {
            payload = form as Partial<SkuReview>;
          }
          await onSave(sku.id, payload);
        }}>
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* ── Status (admin only) ── */}
            {userRole === 'admin' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Review Status</label>
                <select
                  value={form.review_status}
                  onChange={(e) => set('review_status')(e.target.value as ReviewStatus)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base font-medium bg-white focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                >
                  <option value="warehouse">Warehouse</option>
                  <option value="qc">QC</option>
                  <option value="catalog">Catalog</option>
                  <option value="tech">Tech</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            {/* ── Auto-advance banner ── */}
            {autoStatus && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm text-emerald-800">
                <span className="text-base">→</span>
                <span>Saving will automatically move status to <strong>{STATUS_DISPLAY[autoStatus] ?? autoStatus}</strong></span>
              </div>
            )}

            {/* ── Warehouse section ── */}
            {showWarehouse && (
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Warehouse</p>
                <CheckboxRow
                  label="Sample Order Created"
                  hint="Has the sample order been placed with the vendor?"
                  checked={form.sample_order_created}
                  onChange={(v) => set('sample_order_created')(v)}
                />
                <CheckboxRow
                  label="Sample at HQ"
                  hint="Has the physical sample arrived at headquarters?"
                  checked={form.sample_at_hq}
                  onChange={(v) => set('sample_at_hq')(v)}
                />
              </div>
            )}

            {/* ── QC section ── */}
            {showQC && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">QC Checks</p>

                {/* Sample Required — top checkbox */}
                <CheckboxRow
                  label="Sample Required"
                  hint="Does this SKU need a physical sample for inspection? Ticking this sends it to Warehouse."
                  checked={form.sample_required}
                  onChange={(v) => set('sample_required')(v)}
                />

                {/* Size data grid — shown when sample is required */}
                {form.sample_required && (
                  <div className="mt-3 bg-white rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Size Fit Data</p>
                      <div className="flex gap-1">
                        {(['top','bottom'] as const).map((t) => (
                          <button key={t} type="button" onClick={() => setGarmentType(t)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                              garmentType === t ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'
                            }`}>
                            {t === 'top' ? 'Top Wear' : 'Bottom Wear'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 text-center">
                            <th className="text-left pb-1.5 font-semibold">Size</th>
                            <th className="pb-1.5 font-semibold">Return %</th>
                            <th className="pb-1.5 font-semibold text-blue-500">Too Big %</th>
                            <th className="pb-1.5 font-semibold text-orange-500">Too Small %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sizeSeries.map(({ label, returnKey, tooBigKey, tooSmallKey }) => {
                            const ret     = sku[returnKey] as number | null;
                            const tooBig  = sku[tooBigKey] as number | null;
                            const tooSmall = sku[tooSmallKey] as number | null;
                            if (ret == null && tooBig == null && tooSmall == null) return null;
                            return (
                              <tr key={label} className="border-t border-blue-50">
                                <td className="py-1.5 font-bold text-gray-700">{label}</td>
                                <td className="py-1.5 text-center text-red-600 font-semibold">{ret != null ? `${ret}%` : '—'}</td>
                                <td className="py-1.5 text-center text-blue-600 font-semibold">{tooBig != null ? `${tooBig}%` : '—'}</td>
                                <td className="py-1.5 text-center text-orange-600 font-semibold">{tooSmall != null ? `${tooSmall}%` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Rest of QC checks */}
                <YesNoToggle label="Size Check Done" hint="Has the size labelling been physically verified?" value={form.size_check} onChange={set('size_check')} />
                <YesNoToggle label="Fit Trial Completed" hint="Was the garment physically tried on to check fit?" value={form.fit_trial_done} onChange={set('fit_trial_done')} />
                <YesNoToggle label="Need Size Chart Updation" hint="Does the size chart need to be updated by the tech team?" value={form.need_size_chart_updation} onChange={set('need_size_chart_updation')} />
                <YesNoToggle label="Debit Note Raised" hint="Has a debit note been raised for this SKU?" value={form.debit_note_raised} onChange={set('debit_note_raised')} />
                <div className="pt-3">
                  <label className="block text-xs font-semibold text-blue-500 mb-1.5">Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) => set('remarks')(e.target.value)}
                    placeholder="Add observations, notes, or follow-up actions…"
                    rows={3}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* ── Size chart matrix (when size chart updation needed) ── */}
            {showQC && form.need_size_chart_updation === true && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Size Chart Update</p>
                  <div className="flex gap-1">
                    {(['top','bottom'] as const).map((t) => (
                      <button key={t} type="button" onClick={() => handleGarmentTypeChange(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          garmentType === t ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-sky-700 border-sky-200 hover:border-sky-400'
                        }`}>
                        {t === 'top' ? 'Top Wear' : 'Bottom Wear'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-sky-500 mb-3">Enter corrected measurements (cm) for each size.</p>
                <SizeChartMatrix
                  sizes={chartSizes} measurements={chartMeas}
                  data={form.size_chart_update}
                  onChange={(d) => set('size_chart_update')(d)}
                />
              </div>
            )}

            {/* ── Tech section ── */}
            {showTech && (
              <div className="bg-pink-50 rounded-xl p-4">
                <p className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">Tech</p>
                {sku.size_chart_update && Object.keys(sku.size_chart_update).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-pink-600 font-semibold mb-2">Size chart entered by QC:</p>
                    <div className="overflow-x-auto">
                      <table className="text-xs border-collapse w-full">
                        <thead>
                          <tr>
                            <th className="text-left px-2 py-1 font-semibold text-gray-500"></th>
                            {Object.keys(Object.values(sku.size_chart_update)[0] ?? {}).map((m) => (
                              <th key={m} className="px-2 py-1 font-bold text-gray-700 text-center">{m}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(sku.size_chart_update).map(([size, vals]) => (
                            <tr key={size} className="border-t border-pink-100">
                              <td className="px-2 py-1 font-bold text-gray-700">{size}</td>
                              {Object.values(vals).map((v, i) => (
                                <td key={i} className="px-2 py-1 text-center text-gray-600">{v || '—'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <CheckboxRow
                  label="Size Chart Updated"
                  hint="Has the size chart been updated in the system?"
                  checked={form.size_chart_updated}
                  onChange={(v) => set('size_chart_updated')(v)}
                />
              </div>
            )}

            {/* ── Catalog section ── */}
            {showCatalog && (
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">Catalog</p>
                <YesNoToggle
                  label="Description Updated"
                  hint="Has the product description been updated online?"
                  value={form.description_updated}
                  onChange={set('description_updated')}
                />
                {form.description_updated === true && (
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-violet-700 mb-1.5">What was updated?</label>
                    <textarea
                      value={form.description_update_notes}
                      onChange={(e) => set('description_update_notes')(e.target.value)}
                      placeholder="e.g. Updated size chart, changed fit to slim-fit…"
                      rows={2}
                      className="w-full border border-violet-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-white"
                    />
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-8 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-base hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
