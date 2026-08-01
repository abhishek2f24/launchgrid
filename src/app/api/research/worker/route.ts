// Drains the on-demand research queue.
//
//   POST /api/research/worker   Authorization: Bearer <RESEARCH_WORKER_SECRET>
//
// Designed to be poked by a cron (Vercel Cron, GitHub Actions, any scheduler) rather
// than run as a long-lived process, so it works on serverless hosting. Each call
// claims and fulfils up to `batch` requests, then returns.
//
// CLAIMING IS ATOMIC. The update sets status 'queued' → 'running' with a WHERE on
// the current status, so two overlapping cron invocations cannot both fulfil the same
// request — which would double-charge the proxy and could double-write suppliers.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';
import { fulfilRequest, type RequestRow } from '@/lib/research/fulfilRequest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const DEFAULT_BATCH = 5;

export async function POST(req: NextRequest) {
  const secret = process.env.RESEARCH_WORKER_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Worker not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batch = Math.min(Number(new URL(req.url).searchParams.get('batch')) || DEFAULT_BATCH, 25);
  const admin = createServiceClient();
  // The worker ingests through its OWN origin, never NEXT_PUBLIC_APP_URL — that var
  // holds the public production domain, so using it here made a local worker POST its
  // results to production, where the freshly created idea does not exist (404, zero
  // suppliers ingested, customer refunded for a report that was actually fine).
  const baseUrl = new URL(req.url).origin;


  const outcomes: Record<string, number> = { delivered: 0, refunded: 0, retry: 0, skipped: 0 };
  const details: unknown[] = [];

  for (let i = 0; i < batch; i++) {
    const { data: candidates } = await admin
      .from('research_report_requests')
      .select('id, user_id, tenant_id, requested_query, normalized_query, attempts')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1);

    const candidate = candidates?.[0] as RequestRow | undefined;
    if (!candidate) break;

    // Atomic claim: only one caller can flip this row out of 'queued'.
    const { data: claimed } = await admin
      .from('research_report_requests')
      .update({ status: 'running' })
      .eq('id', candidate.id)
      .eq('status', 'queued')
      .select('id')
      .maybeSingle();

    if (!claimed) {
      outcomes.skipped++;
      continue;
    }

    try {
      const outcome = await fulfilRequest(candidate, {
        admin: admin as never,
        baseUrl,
        workerSecret: secret,
        log: (m) => console.log('[research-worker]', m),
      });
      outcomes[outcome.status] = (outcomes[outcome.status] ?? 0) + 1;
      details.push({ id: candidate.id, query: candidate.requested_query, ...outcome });
    } catch (err) {
      // An unexpected throw must not strand the request in 'running' forever, where
      // it would hold the customer's credit and never be retried.
      const message = err instanceof Error ? err.message : String(err);
      await admin
        .from('research_report_requests')
        .update({ status: 'queued', attempts: candidate.attempts + 1, last_error: message })
        .eq('id', candidate.id);
      outcomes.retry++;
      details.push({ id: candidate.id, error: message });
    }
  }

  return NextResponse.json({ outcomes, details });
}
