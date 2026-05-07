import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { SkuReview } from '@/types';
import Dashboard from '@/components/Dashboard';

function getMondayOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

async function getSkusForWeek(weekStart: string): Promise<SkuReview[]> {
  const weekEnd = new Date(weekStart + 'T00:00:00');
  weekEnd.setDate(weekEnd.getDate() + 7);

  const result = await pool.query(
    `SELECT sr.*, u.name AS last_updated_by_name
     FROM sku_reviews sr
     LEFT JOIN users u ON sr.last_updated_by = u.id
     WHERE sr.week_date >= $1 AND sr.week_date < $2
     ORDER BY sr.return_pct DESC NULLS LAST, sr.created_at DESC`,
    [weekStart, weekEnd.toISOString().split('T')[0]]
  );
  return result.rows;
}

async function getAvailableWeeks(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT week_date FROM sku_reviews ORDER BY week_date DESC LIMIT 20`
  );
  return result.rows.map((r: any) => {
    const d = new Date(r.week_date);
    return d.toISOString().split('T')[0];
  });
}

async function getCategories(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT category FROM sku_reviews WHERE category IS NOT NULL ORDER BY category`
  );
  return result.rows.map((r: any) => r.category);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const weekStart = getMondayOfWeek(searchParams.week);
  const [skus, availableWeeks, categories] = await Promise.all([
    getSkusForWeek(weekStart),
    getAvailableWeeks(),
    getCategories(),
  ]);

  const weeksToShow = availableWeeks.includes(weekStart)
    ? availableWeeks
    : [weekStart, ...availableWeeks];

  return (
    <Dashboard
      initialSkus={skus}
      currentWeek={weekStart}
      availableWeeks={weeksToShow}
      categories={categories}
      userName={session.user?.name ?? session.user?.email ?? 'User'}
    />
  );
}
