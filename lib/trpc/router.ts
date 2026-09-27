/**
 * Main tRPC router
 * Combines all sub-routers
 */
import { router } from './init';
import { adminRouter } from './routers/admin';
import { authRouter } from './routers/auth';
import { billingRouter } from './routers/billing';
import { chatRouter } from './routers/chat';
import { customersRouter } from './routers/customers';
import { documentsRouter } from './routers/documents';
import { ordersRouter } from './routers/orders';
import { organizationsRouter } from './routers/organizations';
import { userRouter } from './routers/user';

export const appRouter = router({
  auth: authRouter,
  customers: customersRouter,
  user: userRouter,
  organizations: organizationsRouter,
  billing: billingRouter,
  orders: ordersRouter,
  admin: adminRouter,
  documents: documentsRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
