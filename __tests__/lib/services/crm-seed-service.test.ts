import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  customers,
  orderHistory,
  orders,
  orgMemberships,
  organizations,
  users,
} from '@/lib/db/schema';
import { seedCrmDemo } from '@/lib/services/crm-seed-service';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  execute: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
}));
vi.mock('@/lib/db/drizzle', () => ({ db: { transaction: mocks.transaction } }));

describe('seedCrmDemo', () => {
  const rows = new Map<unknown, Record<string, unknown>[]>();
  const existingIds = new Set<unknown>();
  const selectWhere = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    rows.clear();
    existingIds.clear();
    vi.stubEnv('NODE_ENV', 'test');
    mocks.transaction.mockImplementation(async (callback) => callback(mocks));
    mocks.execute.mockResolvedValue(undefined);
    mocks.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: selectWhere }) });
    mocks.insert.mockImplementation((table: unknown) => ({
      values: (input: Record<string, unknown> | Record<string, unknown>[]) => {
        const values = Array.isArray(input) ? input : [input];
        rows.set(table, [...(rows.get(table) ?? []), ...values]);
        const inserted = values.filter((value) => !existingIds.has(value.id));
        for (const value of values) if (value.id) existingIds.add(value.id);
        return { onConflictDoNothing: () => ({ returning: async () => inserted }) };
      },
    }));
  });

  function queueSelections(hasMemberships = false) {
    for (const result of [
      [{ id: 'jane' }],
      [{ id: 'john' }],
      [{ id: 'org-jane' }],
      hasMemberships ? [{ id: 'membership-jane' }] : [],
      hasMemberships ? [{ id: 'membership-john' }] : [],
      [{ id: 'org-john' }],
      hasMemberships ? [{ id: 'membership-owner' }] : [],
    ])
      selectWhere.mockResolvedValueOnce(result);
  }

  it('populates two dealerships with varied, correctly assigned CRM data', async () => {
    queueSelections();
    expect(await seedCrmDemo()).toEqual({ customersInserted: 40, ordersInserted: 10 });
    const customerRows = rows.get(customers)!;
    expect(new Set(customerRows.map((row) => row.status))).toEqual(
      new Set(['lead', 'prospect', 'active', 'inactive'])
    );
    expect(new Set(customerRows.map((row) => row.id)).size).toBe(40);
    expect(customerRows.filter((row) => row.organizationId === 'org-jane')).toHaveLength(24);
    expect(customerRows.filter((row) => row.organizationId === 'org-john')).toHaveLength(16);
    for (const row of customerRows) {
      expect(row.email).toMatch(/@example\.com$/);
      expect(row.notes).toEqual(expect.any(String));
      expect(row.interestedInModel).toEqual(expect.any(String));
      expect(row.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-8[\da-f]{3}-[\da-f]{12}$/);
      if (row.lastContactedAt instanceof Date) {
        expect(row.lastContactedAt.getTime()).toBeGreaterThanOrEqual(
          (row.createdAt as Date).getTime()
        );
      }
      if (row.organizationId === 'org-john') expect(row.userId).toBe('john');
    }
    expect(rows.get(orgMemberships)).toHaveLength(3);
    expect(rows.get(orderHistory)).toHaveLength(10);
    expect(mocks.select).toHaveBeenCalledWith({ id: users.id });
    expect(mocks.select).toHaveBeenCalledWith({ id: organizations.id });
    expect(mocks.select).toHaveBeenCalledWith({ id: orgMemberships.id });
  });

  it('reuses stable IDs and does not append order history or duplicate memberships on reruns', async () => {
    queueSelections();
    await seedCrmDemo();
    const ids = rows.get(customers)!.map((row) => row.id);
    rows.clear();
    queueSelections(true);
    expect(await seedCrmDemo()).toEqual({ customersInserted: 0, ordersInserted: 0 });
    expect(rows.get(customers)!.map((row) => row.id)).toEqual(ids);
    expect(rows.has(orgMemberships)).toBe(false);
    expect(rows.has(orderHistory)).toBe(false);
    expect(rows.get(orders)).toHaveLength(10);
  });

  it('refuses production before writing data', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await expect(seedCrmDemo()).rejects.toThrow('disabled in production');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('propagates database errors so startup fails instead of silently skipping the seed', async () => {
    mocks.execute.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(seedCrmDemo()).rejects.toThrow('Database unavailable');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
