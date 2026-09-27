/**
 * Customer Service
 * Handles all customer-related business logic and database operations
 */
import { and, asc, count, desc, eq, ilike, or } from 'drizzle-orm';
import ExcelJS from 'exceljs';

import { db } from '@/lib/db/drizzle';
import {
  type Customer,
  type CustomerStatus,
  type NewCustomer,
  customers,
  users,
} from '@/lib/db/schema';

import { ERRORS } from './constants';

/**
 * List customers with server-side filtering, search, pagination, and sorting
 */
export async function listCustomers(params: {
  organizationId: Customer['organizationId'];
  statuses?: CustomerStatus[];
  searchQuery?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastName' | 'lastContactedAt';
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    organizationId,
    statuses,
    searchQuery,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const conditions = [eq(customers.organizationId, organizationId)];

  if (statuses && statuses.length > 0) {
    conditions.push(or(...statuses.map((status) => eq(customers.status, status)))!);
  }

  if (searchQuery && searchQuery.trim()) {
    const searchTerm = `%${searchQuery.trim()}%`;
    conditions.push(
      or(
        ilike(customers.firstName, searchTerm),
        ilike(customers.lastName, searchTerm),
        ilike(customers.email, searchTerm),
        ilike(customers.phone, searchTerm),
        ilike(customers.interestedInModel, searchTerm)
      )!
    );
  }

  const totalResult = await db
    .select({ count: count() })
    .from(customers)
    .where(and(...conditions));

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const sortOrderFn = sortOrder === 'asc' ? asc : desc;
  const sortColumn = customers[sortBy];

  const customersList = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      city: customers.city,
      status: customers.status,
      interestedInModel: customers.interestedInModel,
      notes: customers.notes,
      lastContactedAt: customers.lastContactedAt,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      // Joined sales rep data
      userDisplayName: users.displayName,
      userEmail: users.email,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(...conditions))
    .orderBy(sortOrderFn(sortColumn))
    .limit(limit)
    .offset(offset);

  return {
    customers: customersList,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(params: {
  customerId: Customer['id'];
  organizationId: Customer['organizationId'];
}) {
  const customer = await db
    .select({
      id: customers.id,
      organizationId: customers.organizationId,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      city: customers.city,
      status: customers.status,
      interestedInModel: customers.interestedInModel,
      notes: customers.notes,
      lastContactedAt: customers.lastContactedAt,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,
      userDisplayName: users.displayName,
      userEmail: users.email,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(eq(customers.id, params.customerId), eq(customers.organizationId, params.organizationId))
    )
    .limit(1);

  if (customer.length === 0) {
    throw new Error('Customer not found', { cause: ERRORS.NOT_FOUND });
  }

  return customer[0];
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: NewCustomer) {
  const [newCustomer] = await db
    .insert(customers)
    .values({
      organizationId: customer.organizationId,
      userId: customer.userId,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone ?? null,
      city: customer.city ?? null,
      status: customer.status ?? 'lead',
      interestedInModel: customer.interestedInModel ?? null,
      notes: customer.notes ?? null,
      lastContactedAt: customer.lastContactedAt ?? null,
    })
    .returning();

  if (!newCustomer) {
    throw new Error('Failed to create customer', { cause: ERRORS.INTERNAL_SERVER_ERROR });
  }

  return newCustomer;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(customer: {
  customerId: Customer['id'];
  organizationId: Customer['organizationId'];
  firstName?: Customer['firstName'];
  lastName?: Customer['lastName'];
  email?: Customer['email'];
  phone?: Customer['phone'];
  city?: Customer['city'];
  status?: CustomerStatus;
  interestedInModel?: Customer['interestedInModel'];
  notes?: Customer['notes'];
  lastContactedAt?: Customer['lastContactedAt'];
}) {
  const { customerId, organizationId, ...updateData } = customer;

  const existingCustomer = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)))
    .limit(1);

  if (existingCustomer.length === 0) {
    throw new Error('Customer not found', { cause: ERRORS.NOT_FOUND });
  }

  const [updatedCustomer] = await db
    .update(customers)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId))
    .returning();

  if (!updatedCustomer) {
    throw new Error('Failed to update customer', { cause: ERRORS.INTERNAL_SERVER_ERROR });
  }

  return updatedCustomer;
}

/**
 * Delete a customer
 */
export async function deleteCustomer(params: {
  customerId: Customer['id'];
  organizationId: Customer['organizationId'];
}) {
  const existingCustomer = await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.id, params.customerId), eq(customers.organizationId, params.organizationId))
    )
    .limit(1);

  if (existingCustomer.length === 0) {
    throw new Error('Customer not found', { cause: ERRORS.NOT_FOUND });
  }

  await db.delete(customers).where(eq(customers.id, params.customerId));

  return { success: true };
}

/**
 * Export customers as CSV or Excel format
 */
export async function exportCustomers(params: {
  organizationId: Customer['organizationId'];
  type: 'csv' | 'excel';
}) {
  const { organizationId, type } = params;

  const customersList = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      city: customers.city,
      status: customers.status,
      interestedInModel: customers.interestedInModel,
      lastContactedAt: customers.lastContactedAt,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.organizationId, organizationId))
    .orderBy(desc(customers.createdAt));

  const headers = [
    'Customer ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'City',
    'Status',
    'Interested In',
    'Last Contacted',
    'Created',
  ];
  const rows = customersList.map((customer) => [
    customer.id,
    customer.firstName,
    customer.lastName,
    customer.email,
    customer.phone || '',
    customer.city || '',
    customer.status,
    customer.interestedInModel || '',
    customer.lastContactedAt ? new Date(customer.lastContactedAt).toISOString().split('T')[0] : '',
    new Date(customer.createdAt).toISOString().split('T')[0],
  ]);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Customers');
  worksheet.addRows([headers, ...rows]);

  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `customers-${timestamp}`;

  switch (type) {
    case 'excel': {
      const excelBuffer = await workbook.xlsx.writeBuffer();

      return {
        data: Buffer.from(excelBuffer).toString('base64'),
        filename: `${fileName}.xlsx`,
      };
    }

    case 'csv': {
      const csvBuffer = await workbook.csv.writeBuffer();

      return {
        data: Buffer.from(csvBuffer).toString('utf8'),
        filename: `${fileName}.csv`,
      };
    }

    default:
      throw new Error(`Unsupported export type: ${type}`, { cause: ERRORS.BAD_REQUEST });
  }
}
