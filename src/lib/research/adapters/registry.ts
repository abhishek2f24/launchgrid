// Registry of supplier-side source adapters.
//
// Retail marketplaces (Amazon.in, Flipkart, Meesho) are intentionally NOT
// registered here — LaunchGrid handles retail listings via
// /api/products/fetch-url, so only supplier sources live in this framework.
import type { SourceAdapter, SourceName } from '@/lib/research/adapters/types';
import { indiamartAdapter } from '@/lib/research/adapters/indiamart';
import { alibabaAdapter } from '@/lib/research/adapters/alibaba';
import { yiwugo1688Adapter } from '@/lib/research/adapters/yiwugo1688';
import { madeInChinaAdapter } from '@/lib/research/adapters/madeInChina';
import { tradeindiaAdapter } from '@/lib/research/adapters/tradeindia';
import { globalSourcesAdapter } from '@/lib/research/adapters/globalSources';

export const ADAPTER_REGISTRY: Record<SourceName, SourceAdapter> = {
  indiamart: indiamartAdapter,
  alibaba: alibabaAdapter,
  yiwugo_1688: yiwugo1688Adapter,
  made_in_china: madeInChinaAdapter,
  tradeindia: tradeindiaAdapter,
  global_sources: globalSourcesAdapter,
};

export function getAdapter(source: SourceName): SourceAdapter {
  const adapter = ADAPTER_REGISTRY[source];
  if (!adapter) throw new Error(`No adapter registered for source "${source}"`);
  return adapter;
}

export const SUPPLIER_SOURCES: SourceName[] = [
  'indiamart',
  'alibaba',
  'yiwugo_1688',
  'made_in_china',
  'tradeindia',
  'global_sources',
];

// 1688 requires an authenticated session before it will render search
// results at all, so it is never driven unattended — see yiwugo1688.ts.
export const DEFAULT_ENABLED_SOURCES: SourceName[] = SUPPLIER_SOURCES.filter((s) => s !== 'yiwugo_1688');
