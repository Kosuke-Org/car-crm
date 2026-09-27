/**
 * Customers tRPC Router
 * Thin validation layer that delegates to customer service
 */
import * as customerService from '@/lib/services/customer-service';
import { handleApiError } from '@/lib/utils';

import { orgProcedure, router } from '../init';
import {
  createCustomerSchema,
  customerListFiltersSchema,
  customerStatsSchema,
  deleteCustomerSchema,
  exportCustomersSchema,
  getCustomerSchema,
  updateCustomerSchema,
} from '../schemas/customers';

export const customersRouter = router({
  /**
   * List customers with server-side filtering, search, pagination, and sorting
   */
  list: orgProcedure.input(customerListFiltersSchema).query(async ({ ctx, input }) => {
    try {
      return await customerService.listCustomers({
        organizationId: ctx.organizationId,
        statuses: input?.statuses,
        searchQuery: input?.searchQuery,
        page: input?.page,
        limit: input?.limit,
        sortBy: input?.sortBy,
        sortOrder: input?.sortOrder,
      });
    } catch (error) {
      handleApiError(error);
    }
  }),

  /**
   * Pipeline metrics for the organization dashboard
   */
  stats: orgProcedure.input(customerStatsSchema).query(async ({ ctx }) => {
    try {
      return await customerService.getCustomerStats({
        organizationId: ctx.organizationId,
      });
    } catch (error) {
      handleApiError(error);
    }
  }),

  /**
   * Get a single customer by ID
   */
  get: orgProcedure.input(getCustomerSchema).query(async ({ ctx, input }) => {
    try {
      return await customerService.getCustomerById({
        customerId: input.id,
        organizationId: ctx.organizationId,
      });
    } catch (error) {
      handleApiError(error);
    }
  }),

  /**
   * Create a new customer
   */
  create: orgProcedure.input(createCustomerSchema).mutation(async ({ ctx, input }) => {
    try {
      return await customerService.createCustomer({
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        city: input.city,
        status: input.status,
        interestedInModel: input.interestedInModel,
        notes: input.notes,
        lastContactedAt: input.lastContactedAt,
      });
    } catch (error) {
      handleApiError(error);
    }
  }),

  /**
   * Update an existing customer
   */
  update: orgProcedure.input(updateCustomerSchema).mutation(async ({ ctx, input }) => {
    try {
      return await customerService.updateCustomer({
        customerId: input.id,
        organizationId: ctx.organizationId,
        ...(input.firstName !== undefined && { firstName: input.firstName }),
        ...(input.lastName !== undefined && { lastName: input.lastName }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.interestedInModel !== undefined && {
          interestedInModel: input.interestedInModel,
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.lastContactedAt !== undefined && { lastContactedAt: input.lastContactedAt }),
      });
    } catch (error) {
      handleApiError(error);
    }
  }),

  /**
   * Delete a customer
   */
  delete: orgProcedure.input(deleteCustomerSchema).mutation(async ({ ctx, input }) => {
    try {
      return await customerService.deleteCustomer({
        customerId: input.id,
        organizationId: ctx.organizationId,
      });
    } catch (error) {
      handleApiError(error);
    }
  }),

  /**
   * Export customers as CSV or Excel format
   */
  export: orgProcedure.input(exportCustomersSchema).mutation(async ({ ctx, input }) => {
    try {
      return await customerService.exportCustomers({
        organizationId: ctx.organizationId,
        type: input.type,
      });
    } catch (error) {
      handleApiError(error);
    }
  }),
});
