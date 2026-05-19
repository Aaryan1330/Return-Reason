'use client';

import { SkuReview, STATUS_LABELS, STATUS_COLORS, UserRole } from '@/types';

interface Props {
  skus:     SkuReview[];
  userRole: UserRole;
  onEdit:   (sku: SkuReview) => void;
}

function BoolCell({ value }: { value: boolean | null }) {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
  return value ? (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">Y</span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">N</span>
  );
}

export default function SkuTable({ skus, userRole, onEdit }: Props) {
  const isAdmin     = userRole === 'admin';
  const showWarehouse = isAdmin || userRole === 'warehouse';
  const showQC        = isAdmin || userRole === 'qc';
  const showCatalog   = isAdmin || userRole === 'catalog';
  if (skus.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
        <p className="text-gray-400 text-lg font-medium">No SKUs found.</p>
        <p className="text-gray-300 text-sm mt-1">
          Data will appear once the backend inserts this week&apos;s review list.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="text-left px-4 py-3 font-semibold">Image</th>
              <th className="text-left px-4 py-3 font-semibold">SKU Group</th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-left px-4 py-3 font-semibold">Vendor</th>
              <th className="text-right px-4 py-3 font-semibold">Return %</th>
              <th className="text-right px-4 py-3 font-semibold">Online Inv.</th>
              {showWarehouse && <th className="text-center px-3 py-3 font-semibold">Sample at HQ</th>}
              {showQC && <th className="text-center px-3 py-3 font-semibold">Sample Req.</th>}
              {showQC && <th className="text-center px-3 py-3 font-semibold">Sample Order</th>}
              {showQC && <th className="text-center px-3 py-3 font-semibold">Size Check</th>}
              {showQC && <th className="text-center px-3 py-3 font-semibold">Fit Trial</th>}
              {showQC && <th className="text-center px-3 py-3 font-semibold">Debit Note</th>}
              {showCatalog && <th className="text-center px-3 py-3 font-semibold">Desc. Updated</th>}
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Last Updated By</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {skus.map((sku) => (
              <tr key={sku.id} className="hover:bg-gray-50 transition-colors">
                {/* Image */}
                <td className="px-4 py-3">
                  {sku.image_url ? (
                    <img
                      src={sku.image_url}
                      alt={sku.sku_group}
                      className="object-cover rounded-lg bg-gray-100"
                      style={{ width: 52, height: 68 }}
                    />
                  ) : (
                    <div
                      className="rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs"
                      style={{ width: 52, height: 68 }}
                    >
                      No img
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                  {sku.sku_group}
                </td>
                <td className="px-4 py-3 text-gray-500">{sku.category ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate">
                  {sku.vendor ?? '—'}
                </td>

                {/* Return % */}
                <td className="px-4 py-3 text-right font-bold">
                  {sku.return_pct != null ? (
                    <span
                      className={
                        sku.return_pct > 15
                          ? 'text-red-600'
                          : sku.return_pct >= 10
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }
                    >
                      {sku.return_pct}%
                    </span>
                  ) : '—'}
                </td>

                <td className="px-4 py-3 text-right text-gray-500">
                  {sku.online_inventory != null ? sku.online_inventory.toLocaleString() : '—'}
                </td>

                {showWarehouse && <td className="px-3 py-3 text-center"><BoolCell value={sku.sample_at_hq} /></td>}
                {showQC && <td className="px-3 py-3 text-center"><BoolCell value={sku.sample_required} /></td>}
                {showQC && <td className="px-3 py-3 text-center"><BoolCell value={sku.sample_order_created} /></td>}
                {showQC && <td className="px-3 py-3 text-center"><BoolCell value={sku.size_check} /></td>}
                {showQC && <td className="px-3 py-3 text-center"><BoolCell value={sku.fit_trial_done} /></td>}
                {showQC && <td className="px-3 py-3 text-center"><BoolCell value={sku.debit_note_raised} /></td>}
                {showCatalog && <td className="px-3 py-3 text-center"><BoolCell value={sku.description_updated} /></td>}

                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[sku.review_status]}`}>
                    {STATUS_LABELS[sku.review_status]}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-gray-500">
                  {sku.last_updated_by_name ? (
                    <>
                      <div className="font-medium text-gray-700">{sku.last_updated_by_name}</div>
                      <div className="text-gray-400">
                        {sku.last_updated_at
                          ? new Date(sku.last_updated_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : ''}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => onEdit(sku)}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    Fill / Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
