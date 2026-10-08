import 'server-only';
import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var __fleetSql: postgres.Sql | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, {
    // Supabase's transaction-mode pooler does not support prepared statements.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    onnotice: () => {},
    // numeric -> JS number (amounts are < 1e12 so this is lossless enough
    // for currency with 2 decimals).
    types: {
      numeric: {
        to: 1700,
        from: [1700],
        serialize: (x: number) => String(x),
        parse: (x: string) => Number(x),
      },
    },
  });
}

// Reuse one pool across hot reloads / warm serverless invocations.
export const sql: postgres.Sql = globalThis.__fleetSql ?? (globalThis.__fleetSql = create());
