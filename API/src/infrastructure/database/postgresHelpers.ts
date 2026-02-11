import { Pool, PoolClient, QueryResult } from 'pg';

export type Queryable = Pool | PoolClient;

export function dbRun(db: Queryable, sql: string, params: any[] = []): Promise<{ changes: number; lastID: number }> {
  return new Promise((resolve, reject) => {
    db.query(sql, params).then((result) => {
      resolve({ changes: result.rowCount || 0, lastID: 0 }); // lastID not supported directly
    }).catch(reject);
  });
}

export function dbGet<T>(db: Queryable, sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.query(sql, params).then((result) => {
      resolve(result.rows[0] as T | undefined);
    }).catch(reject);
  });
}

export function dbAll<T>(db: Queryable, sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.query(sql, params).then((result) => {
      resolve(result.rows as T[]);
    }).catch(reject);
  });
}

export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
