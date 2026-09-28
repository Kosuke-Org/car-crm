import { createHash } from 'node:crypto';

import { Faker, en } from '@faker-js/faker';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  type NewCustomer,
  type NewOrder,
  type NewOrgMembership,
  customers,
  orderHistory,
  orders,
  orgMemberships,
  organizations,
  users,
} from '@/lib/db/schema';
import { ERRORS } from '@/lib/services/constants';

// Stable identities make retries insert-only, preserving edits to existing demo records.
function seedId(key: string): string {
  const hash = createHash('sha256').update(`autoyard-crm-v1:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function seedCrmDemo(): Promise<{
  customersInserted: number;
  ordersInserted: number;
}> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRM demo seeding is disabled in production', { cause: ERRORS.FORBIDDEN });
  }

  const faker = new Faker({ locale: [en] });
  faker.seed(424242);
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

  return db.transaction(async (tx) => {
    // Memberships have no unique (organizationId, userId) constraint. Serialize seed runs.
    await tx.execute(sql`select pg_advisory_xact_lock(424242, 15)`);
    const reps = [];
    for (const [email, displayName] of [
      ['jane+kosuke_test@example.com', 'Jane Smith'],
      ['john+kosuke_test@example.com', 'John Doe'],
    ]) {
      await tx
        .insert(users)
        .values({ email, displayName, emailVerified: true, role: 'user' })
        .onConflictDoNothing({ target: users.email });
      const [rep] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
      if (!rep) throw new Error('Demo sales representative was not created');
      reps.push(rep);
    }

    const dealerships = [
      { slug: 'jane-smith-co', name: 'AutoYard Motors', owner: reps[0], count: 24 },
      { slug: 'john-doe-ltd', name: 'Lakeside Auto', owner: reps[1], count: 16 },
    ];
    const vehicles = [
      'Toyota Corolla Hybrid',
      'Volkswagen Golf',
      'Tesla Model 3',
      'BMW X3',
      'Ford Kuga',
      'Audi A4',
      'Kia Sportage',
      'Volvo XC60',
    ];
    const scenarios = [
      { status: 'lead', note: 'Website enquiry. Confirm budget and offer a showroom appointment.' },
      {
        status: 'prospect',
        note: 'Test drive completed. Send finance options and trade-in valuation.',
      },
      {
        status: 'active',
        note: 'Vehicle collected. Follow up on ownership experience and service plan.',
      },
      {
        status: 'inactive',
        note: 'Purchase postponed. Reconnect when a suitable used vehicle arrives.',
      },
    ] as const;
    let customersInserted = 0;
    let ordersInserted = 0;

    for (const dealership of dealerships) {
      await tx
        .insert(organizations)
        .values({ name: dealership.name, slug: dealership.slug })
        .onConflictDoNothing({ target: organizations.slug });
      const [organization] = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, dealership.slug));
      if (!organization) throw new Error('Demo dealership was not created');

      const salesReps = dealership.slug === 'jane-smith-co' ? reps : [dealership.owner];
      for (const rep of salesReps) {
        const [existingMembership] = await tx
          .select({ id: orgMemberships.id })
          .from(orgMemberships)
          .where(
            and(
              eq(orgMemberships.organizationId, organization.id),
              eq(orgMemberships.userId, rep.id)
            )
          );
        if (!existingMembership) {
          const membership: NewOrgMembership = {
            id: seedId(`${dealership.slug}:member:${rep.id}`),
            organizationId: organization.id,
            userId: rep.id,
            role: rep.id === dealership.owner.id ? 'owner' : 'member',
          };
          await tx.insert(orgMemberships).values(membership).onConflictDoNothing();
        }
      }

      const demoCustomers: NewCustomer[] = Array.from({ length: dealership.count }, (_, i) => {
        const scenario = scenarios[i % scenarios.length];
        const createdAt = daysAgo(i < 8 ? i / 4 : i * 2);
        return {
          id: seedId(`${dealership.slug}:customer:${i}`),
          organizationId: organization.id,
          userId: salesReps[i % salesReps.length].id,
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: `customer.${i + 1}.${dealership.slug}@example.com`,
          phone: `+1-202-555-${String(100 + i).padStart(4, '0')}`,
          city: faker.helpers.arrayElement(['Austin', 'Round Rock', 'Cedar Park', 'Georgetown']),
          status: scenario.status,
          interestedInModel: vehicles[i % vehicles.length],
          notes: scenario.note,
          lastContactedAt: scenario.status === 'lead' ? null : daysAgo(i < 8 ? i / 8 : i),
          createdAt,
          updatedAt: createdAt,
        };
      });
      const insertedCustomers = await tx
        .insert(customers)
        .values(demoCustomers)
        .onConflictDoNothing({ target: customers.id })
        .returning({ id: customers.id });
      customersInserted += insertedCustomers.length;

      // Orders use the same customer names and sales reps as the dealership pipeline.
      const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
      for (const [i, status] of statuses.entries()) {
        const customer = demoCustomers[i];
        const orderDate = daysAgo(i / 8);
        const order: NewOrder = {
          id: seedId(`${dealership.slug}:order:${i}`),
          organizationId: organization.id,
          userId: customer.userId,
          customerName: `${customer.firstName} ${customer.lastName}`,
          status,
          amount: String(24500 + i * 3750),
          currency: 'USD',
          orderDate,
          createdAt: orderDate,
          updatedAt: orderDate,
          notes: `${customer.interestedInModel}. ${status === 'cancelled' ? 'Buyer postponed purchase; deposit refunded.' : 'Includes pre-delivery inspection and registration.'}`,
        };
        const inserted = await tx
          .insert(orders)
          .values(order)
          .onConflictDoNothing({ target: orders.id })
          .returning({ id: orders.id });
        ordersInserted += inserted.length;
        // Never append stale history to an existing order that someone may have edited.
        if (inserted.length) {
          await tx.insert(orderHistory).values({
            id: seedId(`${dealership.slug}:order-history:${i}`),
            orderId: inserted[0].id,
            userId: customer.userId,
            status,
            notes: order.notes,
            createdAt: orderDate,
          });
        }
      }
    }
    return { customersInserted, ordersInserted };
  });
}
