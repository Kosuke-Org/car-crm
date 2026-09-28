#!/usr/bin/env bun
// Usage: bun run lib/db/scripts/crm-seed.ts (after db:migrate).
// Safe on every preview startup; no Stripe or email calls and no database reset.
import { seedCrmDemo } from '../../services/crm-seed-service';

try {
  const result = await seedCrmDemo();
  console.log(
    `CRM seed complete: ${result.customersInserted} customers and ${result.ordersInserted} orders added.`
  );
  process.exit(0);
} catch (error) {
  console.error('CRM seed failed:', error);
  process.exit(1);
}
