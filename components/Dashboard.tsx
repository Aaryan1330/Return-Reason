'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { SkuReview, SkuType, SummaryStats, TEAM_STATUSES } from '@/types';
import SummaryCards from './SummaryCards';
import SkuTable from './SkuTable';
import EditModal from './EditModal';

interface Props {
  initialSkus: SkuReview[];
  skuType: SkuType;
  currentWeek: string;
  availableWeeks: string[];
  categories: string[];
  userName: string;
}

function computeStats(skus: SkuReview[]): SummaryStats {
  const inTeam = (team: keyof typeof TEAM_STATUSES) =>
    skus.filter((s) => (TEAM_STATUSES[team] as readonly string[]).includes(s.review_status)).length;
  return {
    total:     skus.length,
    warehouse: inTeam('warehouse'),
    qc:        inTeam('qc'),
    catalog:   inTeam('catalog'),
    tech:      inTeam('tech'),
    complete:  skus.filter((s) => s.review_status === 'complete').length,
  };
}

function formatWeekLabel(dateStr: string): string {
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
}

function NavItem({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
        active
          ? 'bg-gray-900 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-800'}`}>
        {label}
      </div>
      <div className={`text-xs mt-0.5 ${active ? 'text-gray-300' : 'text-gray-400'}`}>{sub}</div>
    </button>
  );
}

export default function Dashboard({
  initialSkus,
  skuType,
  currentWeek,
  availableWeeks,
  categories,
  userName,
}: Props) {
  const router = useRouter();
  const [skus, setSkus] = useState<SkuReview[]>(initialSkus);
  const [selectedSku, setSelectedSku] = useState<SkuReview | null>(null);
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = computeStats(skus);

  const filtered = skus.filter((s) => {
    if (filterTeam !== 'all') {
      const teamStatuses = TEAM_STATUSES[filterTeam as keyof typeof TEAM_STATUSES] as readonly string[];
      if (!teamStatuses.includes(s.review_status)) return false;
    }
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.sku_group.toLowerCase().includes(q) &&
        !(s.category ?? '').toLowerCase().includes(q) &&
        !(s.vendor ?? '').toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const navigateTo = (type: SkuType, week?: string) => {
    const params = new URLSearchParams({ type });
    if (type === 'weekly' && week) params.set('week', week);
    router.push(`/?${params.toString()}`);
  };

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
            <h1 className="text-base font-bold text-gray-900 tracking-tight">
              Snitch — Returns Review
            </h1>
            <p className="text-xs text-gray-400">Size &amp; Fit Quality Control</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              Hello, <strong>{userName}</strong>
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

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col p-3 gap-1 min-h-full">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-2">
            Review Type
          </p>
          <NavItem
            label="Weekly Review"
            sub="New SKUs this week"
            active={skuType === 'weekly'}
            onClick={() => navigateTo('weekly', currentWeek)}
          />
          <NavItem
            label="Repeat Products"
            sub="Static SKU list"
            active={skuType === 'repeat'}
            onClick={() => navigateTo('repeat')}
          />
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-auto p-6 space-y-5">

          {/* Week selector — weekly only */}
          {skuType === 'weekly' && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">Week:</span>
              <select
                value={currentWeek}
                onChange={(e) => navigateTo('weekly', e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-700 font-medium"
              >
                {availableWeeks.map((w) => (
                  <option key={w} value={w}>{formatWeekLabel(w)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Summary cards */}
          <SummaryCards stats={stats} />

          {/* Instruction banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-800">
            Click <strong>Fill / Edit</strong> on any row to review that SKU. All changes save immediately.
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
            </select>
            <span className="text-sm text-gray-400 ml-auto">
              {filtered.length} of {skus.length} items
            </span>
          </div>

          {/* Table */}
          <SkuTable skus={filtered} onEdit={setSelectedSku} />
        </main>
      </div>

      {/* Edit Modal */}
      {selectedSku && (
        <EditModal
          sku={selectedSku}
          saving={saving}
          onClose={() => setSelectedSku(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
