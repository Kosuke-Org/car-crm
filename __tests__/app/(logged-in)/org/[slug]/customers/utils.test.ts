/**
 * Tests for the customers feature utilities
 */
import { getChangedCustomerFields } from '@/app/(logged-in)/org/[slug]/customers/utils';

describe('getChangedCustomerFields', () => {
  // What the edit form opens with for a stored customer
  const initialValues = {
    firstName: 'Maria',
    lastName: 'Rossi',
    email: 'maria@example.com',
    phone: '+1 555 0100',
    city: undefined,
    status: 'lead' as const,
    interestedInModel: 'Golf',
    lastContactedAt: new Date('2026-03-01'),
    notes: undefined,
  };

  it('returns nothing when no field changed', () => {
    expect(
      getChangedCustomerFields({
        initialValues,
        values: { ...initialValues, lastContactedAt: new Date('2026-03-01') },
      })
    ).toEqual({});
  });

  it('leaves out an untouched status, so a status changed elsewhere is kept', () => {
    expect(
      getChangedCustomerFields({
        initialValues,
        values: { ...initialValues, phone: '+1 555 0199' },
      })
    ).toEqual({ phone: '+1 555 0199' });
  });

  it('sends a status the member changed', () => {
    expect(
      getChangedCustomerFields({ initialValues, values: { ...initialValues, status: 'active' } })
    ).toEqual({ status: 'active' });
  });

  it('treats an optional field typed and emptied again as unchanged', () => {
    expect(
      getChangedCustomerFields({ initialValues, values: { ...initialValues, city: '', notes: '' } })
    ).toEqual({});
  });

  it('sends a cleared field, and a cleared date as null', () => {
    expect(
      getChangedCustomerFields({
        initialValues,
        values: { ...initialValues, phone: '', lastContactedAt: undefined },
      })
    ).toEqual({ phone: '', lastContactedAt: null });
  });

  it('sends a newly picked date', () => {
    const lastContactedAt = new Date('2026-04-02');
    expect(
      getChangedCustomerFields({ initialValues, values: { ...initialValues, lastContactedAt } })
    ).toEqual({ lastContactedAt });
  });
});
