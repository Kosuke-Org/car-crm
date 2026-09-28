/**
 * Customer utilities
 * Shared constants and helper functions for the customers feature
 */
import type { CustomerChanges, CustomerStatus } from '@/lib/types';

export const statusOptions: { value: CustomerStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const statusColors: Record<CustomerStatus, string> = {
  lead: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  prospect: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  active: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  inactive:
    'bg-chart-1/10 text-chart-1 border-chart-1/20 dark:bg-chart-5/10 dark:text-chart-5 dark:border-chart-5/20',
};

/**
 * The fields of an edit form that differ from the values it opened with. Untouched fields
 * are left out, so the update keeps what the server holds now (e.g. a status changed on the
 * board after the form's data was loaded). A field cleared to undefined is sent as null.
 */
export function getChangedCustomerFields(params: {
  initialValues: CustomerChanges;
  values: CustomerChanges;
}): CustomerChanges {
  const { initialValues, values } = params;
  const isChanged = (key: keyof CustomerChanges) => {
    const before = initialValues[key];
    const after = values[key];
    if (before instanceof Date && after instanceof Date) {
      return before.getTime() !== after.getTime();
    }
    // An empty field is undefined, null or '' depending on where it was read
    return (before ?? '') !== (after ?? '');
  };

  return {
    ...(isChanged('firstName') && { firstName: values.firstName }),
    ...(isChanged('lastName') && { lastName: values.lastName }),
    ...(isChanged('email') && { email: values.email }),
    ...(isChanged('phone') && { phone: values.phone ?? null }),
    ...(isChanged('city') && { city: values.city ?? null }),
    ...(isChanged('status') && { status: values.status }),
    ...(isChanged('interestedInModel') && {
      interestedInModel: values.interestedInModel ?? null,
    }),
    ...(isChanged('notes') && { notes: values.notes ?? null }),
    ...(isChanged('lastContactedAt') && { lastContactedAt: values.lastContactedAt ?? null }),
  };
}
