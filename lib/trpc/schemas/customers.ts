/**
 * Shared Zod schemas for customer validation
 * These schemas are used by both tRPC router (server) and forms (client)
 * NO SERVER DEPENDENCIES - can be imported in client components
 */
import { z } from 'zod';

const customerStatusZodEnum = z.enum(['lead', 'prospect', 'active', 'inactive']);

export const exportTypeEnum = z.enum(['csv', 'excel']);
export type ExportType = z.infer<typeof exportTypeEnum>;

export const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(255),
  lastName: z.string().trim().min(1, 'Last name is required').max(255),
  email: z.email('Invalid email address'),
  phone: z.string().trim().max(50).optional(),
  city: z.string().trim().max(255).optional(),
  status: customerStatusZodEnum.optional(),
  interestedInModel: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional(),
  lastContactedAt: z.date().optional(),
  organizationId: z.uuid(),
});

export const updateCustomerSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  firstName: z.string().trim().min(1, 'First name is required').max(255).optional(),
  lastName: z.string().trim().min(1, 'Last name is required').max(255).optional(),
  email: z.email('Invalid email address').optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  city: z.string().trim().max(255).nullable().optional(),
  status: customerStatusZodEnum.optional(),
  interestedInModel: z.string().trim().max(255).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  lastContactedAt: z.date().nullable().optional(),
});

export const customerListFiltersSchema = z
  .object({
    statuses: z.array(customerStatusZodEnum).optional(),
    searchQuery: z.string().optional(),
    organizationId: z.uuid(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
    sortBy: z.enum(['createdAt', 'lastName', 'lastContactedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  })
  .optional();

export const getCustomerSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
});

export const deleteCustomerSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
});

export const exportCustomersSchema = z.object({
  organizationId: z.uuid(),
  type: exportTypeEnum,
});
