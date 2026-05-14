import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { SkuReview, UserRole } from '@/types';
import Dashboard from '@/components/Dashboard';

async function getSkus(): Promise<SkuReview[]> {
  const result = await pool.query(
    `SELECT sr.*, u.name AS last_updated_by_name
     FROM sku_reviews sr
     LEFT JOIN users u ON sr.last_updated_by = u.id
     WHERE sr.type = 'repeat'
     ORDER BY sr.return_pct DESC NULLS LAST`
  );
  return result.rows;
}

async function getCategories(): Promise<string[]> {
  const result = await pool.query(
    `SELECT DISTINCT category FROM sku_reviews
     WHERE type = 'repeat' AND category IS NOT NULL
     ORDER BY category`
  );
  return result.rows.map((r: any) => r.category);
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [skus, categories] = await Promise.all([getSkus(), getCategories()]);
  const userRole = ((session.user as any)?.role ?? 'admin') as UserRole;

  return (
    <Dashboard
      initialSkus={skus}
      categories={categories}
      userName={session.user?.name ?? session.user?.email ?? 'User'}
      userRole={userRole}
    />
  );
}
