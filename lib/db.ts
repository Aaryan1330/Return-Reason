import { Pool } from 'pg';

const globalForDb = globalThis as unknown as { pool: Pool };

const pool =
  globalForDb.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export default pool;
