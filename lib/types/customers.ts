import type { inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from '@/lib/trpc/router';

type RouterOutput = inferRouterOutputs<AppRouter>;

export type CustomerWithDetails = RouterOutput['customers']['list']['customers'][number];
