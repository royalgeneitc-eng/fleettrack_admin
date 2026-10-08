import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { HttpError, badRequest } from './errors';

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

/** Wraps a route handler: JSON-encodes the result and maps errors to status codes. */
export function route<C = { params: Promise<Record<string, string>> }>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    try {
      const result = await fn(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        const first = e.issues[0];
        const msg = first ? `${first.path.join('.') || 'input'}: ${first.message}` : 'Invalid input';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      const pg = e as { code?: string };
      if (pg?.code === '23505') return NextResponse.json({ error: 'That record already exists' }, { status: 409 });
      console.error(e);
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Request body must be JSON');
  }
  return schema.parse(raw);
}

export function query(req: Request) {
  return new URL(req.url).searchParams;
}
