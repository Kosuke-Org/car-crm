import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db/drizzle';
import { type Customer } from '@/lib/db/schema';
import * as customerService from '@/lib/services/customer-service';

// Mock the database
vi.mock('@/lib/db/drizzle', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the exceljs library
const excelMocks = vi.hoisted(() => {
  const xlsxBytes = Buffer.from('base64data');
  const csvBytes = Buffer.from('csv,data,here');

  const addRows = vi.fn();
  const addWorksheet = vi.fn(() => ({ addRows }));
  const writeXlsxBuffer = vi.fn(async () => xlsxBytes);
  const writeCsvBuffer = vi.fn(async () => csvBytes);

  return { xlsxBytes, csvBytes, addRows, addWorksheet, writeXlsxBuffer, writeCsvBuffer };
});

vi.mock('exceljs', () => {
  const Workbook = vi.fn(() => ({
    addWorksheet: excelMocks.addWorksheet,
    xlsx: { writeBuffer: excelMocks.writeXlsxBuffer },
    csv: { writeBuffer: excelMocks.writeCsvBuffer },
  }));

  return { default: { Workbook }, Workbook };
});

describe('CustomerService', () => {
  const mockOrganizationId = 'org-123';
  const mockUserId = 'user-123';
  const mockCustomerId = 'customer-123';

  const mockCustomer: Customer = {
    id: mockCustomerId,
    organizationId: mockOrganizationId,
    userId: mockUserId,
    firstName: 'Maria',
    lastName: 'Rossi',
    email: 'maria.rossi@example.com',
    phone: '+1 555 0100',
    city: 'Milan',
    status: 'lead',
    interestedInModel: 'Volkswagen Golf',
    notes: 'Wants a test drive',
    lastContactedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockCustomerWithJoins = {
    id: mockCustomer.id,
    firstName: mockCustomer.firstName,
    lastName: mockCustomer.lastName,
    email: mockCustomer.email,
    phone: mockCustomer.phone,
    city: mockCustomer.city,
    status: mockCustomer.status,
    interestedInModel: mockCustomer.interestedInModel,
    notes: mockCustomer.notes,
    lastContactedAt: mockCustomer.lastContactedAt,
    createdAt: mockCustomer.createdAt,
    updatedAt: mockCustomer.updatedAt,
    userDisplayName: 'Test User',
    userEmail: 'test@example.com',
  };

  const mockListQuery = (count: number, rows: unknown[]) => {
    const mockSelect = vi.fn().mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count }]),
      }),
    });

    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(rows),
              }),
            }),
          }),
        }),
      }),
    });

    vi.mocked(db.select).mockImplementation(mockSelect);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCustomers', () => {
    it('should list customers with default parameters', async () => {
      mockListQuery(1, [mockCustomerWithJoins]);

      const result = await customerService.listCustomers({
        organizationId: mockOrganizationId,
      });

      expect(result).toEqual({
        customers: [mockCustomerWithJoins],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should filter customers by status', async () => {
      mockListQuery(2, [mockCustomerWithJoins]);

      const result = await customerService.listCustomers({
        organizationId: mockOrganizationId,
        statuses: ['lead', 'prospect'],
      });

      expect(result.customers).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('should filter customers by search query', async () => {
      mockListQuery(1, [mockCustomerWithJoins]);

      const result = await customerService.listCustomers({
        organizationId: mockOrganizationId,
        searchQuery: 'Rossi',
      });

      expect(result.customers[0].lastName).toBe('Rossi');
    });

    it('should paginate customers correctly', async () => {
      mockListQuery(25, [mockCustomerWithJoins]);

      const result = await customerService.listCustomers({
        organizationId: mockOrganizationId,
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getCustomerById', () => {
    it('should return the customer with sales rep details', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockCustomerWithJoins]),
            }),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);

      const result = await customerService.getCustomerById({
        customerId: mockCustomerId,
        organizationId: mockOrganizationId,
      });

      expect(result).toEqual(mockCustomerWithJoins);
    });

    it('should throw when the customer does not exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);

      await expect(
        customerService.getCustomerById({
          customerId: mockCustomerId,
          organizationId: mockOrganizationId,
        })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('createCustomer', () => {
    it('should create a customer and default the status to lead', async () => {
      const values = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockCustomer]),
      });
      const mockInsert = vi.fn().mockReturnValue({ values });

      vi.mocked(db.insert).mockImplementation(mockInsert);

      const result = await customerService.createCustomer({
        organizationId: mockOrganizationId,
        userId: mockUserId,
        firstName: 'Maria',
        lastName: 'Rossi',
        email: 'maria.rossi@example.com',
      });

      expect(values).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: mockOrganizationId,
          userId: mockUserId,
          status: 'lead',
          phone: null,
          city: null,
          interestedInModel: null,
          notes: null,
          lastContactedAt: null,
        })
      );
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);

      const set = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ ...mockCustomer, status: 'active' }]),
        }),
      });
      const mockUpdate = vi.fn().mockReturnValue({ set });

      vi.mocked(db.update).mockImplementation(mockUpdate);

      const result = await customerService.updateCustomer({
        customerId: mockCustomerId,
        organizationId: mockOrganizationId,
        status: 'active',
      });

      expect(set).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', updatedAt: expect.any(Date) })
      );
      expect(result.status).toBe('active');
    });

    it('should throw when the customer does not exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);

      await expect(
        customerService.updateCustomer({
          customerId: mockCustomerId,
          organizationId: mockOrganizationId,
          status: 'active',
        })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete an existing customer', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);

      const where = vi.fn().mockResolvedValue(undefined);
      const mockDelete = vi.fn().mockReturnValue({ where });

      vi.mocked(db.delete).mockImplementation(mockDelete);

      const result = await customerService.deleteCustomer({
        customerId: mockCustomerId,
        organizationId: mockOrganizationId,
      });

      expect(where).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('exportCustomers', () => {
    beforeEach(() => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      });

      vi.mocked(db.select).mockImplementation(mockSelect);
    });

    it('should export customers as CSV', async () => {
      const result = await customerService.exportCustomers({
        organizationId: mockOrganizationId,
        type: 'csv',
      });

      expect(result.filename).toMatch(/^customers-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(result.data).toBe(excelMocks.csvBytes.toString('utf8'));
      expect(excelMocks.addRows).toHaveBeenCalledWith([
        [
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
        ],
        [
          mockCustomer.id,
          mockCustomer.firstName,
          mockCustomer.lastName,
          mockCustomer.email,
          mockCustomer.phone,
          mockCustomer.city,
          mockCustomer.status,
          mockCustomer.interestedInModel,
          '2024-01-15',
          '2024-01-10',
        ],
      ]);
    });

    it('should export customers as Excel', async () => {
      const result = await customerService.exportCustomers({
        organizationId: mockOrganizationId,
        type: 'excel',
      });

      expect(result.filename).toMatch(/^customers-\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(result.data).toBe(excelMocks.xlsxBytes.toString('base64'));
    });
  });
});
