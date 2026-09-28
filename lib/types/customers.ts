import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

import type { AppRouter } from '@/lib/trpc/router';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

export type CustomerWithDetails = RouterOutput['customers']['list']['customers'][number];

/** Fields a customer update can change (the update input without its identifiers) */
export type CustomerChanges = Omit<RouterInput['customers']['update'], 'id' | 'organizationId'>;
