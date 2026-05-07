'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { SkuReview, ReviewStatus, SummaryStats } from '@/types';
import SummaryCards from './SummaryCards';
import SkuTable from './SkuTable';
import EditModal from './EditModal';

interface Props {
  initialSkus: SkuReview[];
  currentWeek: string;
  availableWeeks: string[];
  categories: string[];
  userName: string;
}

function computeStats(skus: SkuReview[]): SummaryStats {
  return {
    total: skus.length,
    pending: skus.filter((s) => s.review_status === 'pending').length,
    in_review: skus.filter((s) => s.review_status === 'in_review').length,
    action_taken: skus.filter((s) => s.review_status === 'action_taken').length,
    resolved: skus.filter((s) => s.review_status === 'resolved').length,
    escalated: skus.filter((s) => s.review_status === 'escalated').length,
  };
}

function formatWeekLabel(dateStr: string): string {
  // dateStr is the Monday of the week
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `Week of ${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', opts)}`;
}

export default function Dashboard({
  initialSkus,
  currentWeek,
  availableWeeks,
  categories,
  userName,
}: Props) {
  const router = useRouter();
  const [skus, setSkus] = useState<SkuReview[]>(initialSkus);
  const [selectedSku, setSelectedSku] = useState<SkuReview | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const stats = computeStats(skus);

  const filtered = skus.filter((s) => {
    if (filterStatus !== 'all' && s.review_status !== filterStatus) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.sku_group.toLowerCase().includes(q) && !(s.category ?? '').toLowerCase().includes(q)) {
        return false;
      }
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
      if (!res.ok) throw new Error('Save failed');
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
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">
              Snitch — Returns Review
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Size &amp; Fit Quality Control</p>
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

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* ── Week Selector ── */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Viewing week:</span>
          <select
            value={currentWeek}
            onChange={(e) => router.push(`/?week=${e.target.value}`)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-700 font-medium"
          >
            {availableWeeks.map((w) => (
              <option key={w} value={w}>{formatWeekLabel(w)}</option>
            ))}
          </select>
        </div>

        {/* ── Summary Cards ── */}
        <SummaryCards stats={stats} />

        {/* ── Info banner ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>Instructions:</strong> Click the <strong>Fill / Edit</strong> button on any row to
          fill in your checks for that SKU. Use the status field to track your progress. All changes
          are saved immediately.
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search SKU or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white w-52 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Not Started</option>
            <option value="in_review">Under Review</option>
            <option value="action_taken">Action Taken</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
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
          <span className="text-sm text-gray-400 ml-auto">
            {filtered.length} of {skus.length} items
          </span>
        </div>

        {/* ── Table ── */}
        <SkuTable skus={filtered} onEdit={setSelectedSku} />
      </main>

      {/* ── Edit Modal ── */}
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
