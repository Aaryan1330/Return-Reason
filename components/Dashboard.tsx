'use client';

import { useCallback, useState } from 'react';
import { signOut } from 'next-auth/react';
import { SkuReview, SummaryStats, UserRole } from '@/types';
import SummaryCards from './SummaryCards';
import SkuTable from './SkuTable';
import EditModal from './EditModal';

interface Props {
  initialSkus: SkuReview[];
  categories:  string[];
  userName:    string;
  userRole:    UserRole;
}

function computeStats(skus: SkuReview[]): SummaryStats {
  return {
    total:     skus.length,
    warehouse: skus.filter((s) => s.review_status === 'warehouse').length,
    qc:        skus.filter((s) => s.review_status === 'qc').length,
    catalog:   skus.filter((s) => s.review_status === 'catalog').length,
    tech:      skus.filter((s) => s.review_status === 'tech').length,
    completed: skus.filter((s) => s.review_status === 'completed').length,
  };
}

export default function Dashboard({ initialSkus, categories, userName, userRole }: Props) {
  const [skus, setSkus] = useState<SkuReview[]>(initialSkus);
  const [selectedSku, setSelectedSku] = useState<SkuReview | null>(null);
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = computeStats(skus);

  const filtered = skus.filter((s) => {
    if (filterTeam !== 'all' && s.review_status !== filterTeam) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.sku_group.toLowerCase().includes(q) &&
        !(s.category ?? '').toLowerCase().includes(q) &&
        !(s.vendor ?? '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const handleSave = useCallback(async (id: number, data: Partial<SkuReview>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/skus/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const updated: SkuReview = await res.json();
      setSkus((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSelectedSku(null);
    } catch {
      alert('Could not save changes. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Snitch — Size &amp; Fit Returns</h1>
            <p className="text-xs text-gray-400">Quality Control Workflow</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Hello, <strong>{userName}</strong>
              {userRole !== 'admin' && (
                <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                  {userRole}
                </span>
              )}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto p-6 space-y-5">
        <SummaryCards stats={stats} />

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
          Click <strong>Fill / Edit</strong> on any row to review that SKU. Status advances automatically when all required fields are filled.
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search SKU, category, vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white w-56 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-700"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-700"
          >
            <option value="all">All Products</option>
            <option value="warehouse">Warehouse</option>
            <option value="qc">QC</option>
            <option value="catalog">Catalog</option>
            <option value="tech">Tech</option>
            <option value="completed">Completed</option>
          </select>
          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} of {skus.length} items
          </span>
        </div>

        <SkuTable skus={filtered} onEdit={setSelectedSku} />
      </main>

      {selectedSku && (
        <EditModal
          sku={selectedSku}
          saving={saving}
          userRole={userRole}
          onClose={() => setSelectedSku(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
