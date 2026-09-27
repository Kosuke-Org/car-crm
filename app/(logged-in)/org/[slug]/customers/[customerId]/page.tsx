/**
 * Customer Detail Page
 * Displays full customer information with inline note editing
 */

'use client';

import { use, useState } from 'react';

import { useRouter } from 'next/navigation';

import { format } from 'date-fns';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

import { useCustomerActions } from '@/hooks/use-customers';
import { useOrganization } from '@/hooks/use-organization';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { CustomerDialog } from '../components/customer-dialog';
import { statusColors } from '../utils';

function CustomerDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-full max-w-sm" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

interface CustomerDetailPageProps {
  params: Promise<{
    slug: string;
    customerId: string;
  }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { organization: activeOrganization } = useOrganization();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const activeOrgId = activeOrganization?.id;

  const { data: customer, isLoading } = trpc.customers.get.useQuery(
    {
      id: resolvedParams.customerId,
      organizationId: activeOrgId ?? '',
    },
    {
      staleTime: 1000 * 60 * 2, // 2 minutes
      enabled: !!resolvedParams.customerId && !!activeOrgId,
    }
  );

  const { updateCustomer, deleteCustomer, isUpdating, isDeleting } = useCustomerActions();

  const handleDelete = async () => {
    if (!activeOrgId) return;
    await deleteCustomer({ id: resolvedParams.customerId, organizationId: activeOrgId });
    router.push(`/org/${resolvedParams.slug}/customers`);
  };

  const handleNotesUpdate = async (notes: string) => {
    if (!customer || !activeOrgId) return;
    const trimmed = notes.trim();
    if ((customer.notes ?? '') === trimmed) return;

    await updateCustomer({
      id: resolvedParams.customerId,
      organizationId: activeOrgId,
      notes: trimmed || null,
    });
    utils.customers.get.invalidate({
      id: resolvedParams.customerId,
      organizationId: activeOrgId,
    });
  };

  if (isLoading || !activeOrgId) {
    return <CustomerDetailSkeleton />;
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="mb-1 text-lg font-semibold">Customer not found</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          The customer you&apos;re looking for doesn&apos;t exist, has been deleted, or you
          don&apos;t have permission to view it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {customer.firstName} {customer.lastName}
            </h1>
            <Badge className={statusColors[customer.status]}>{customer.status}</Badge>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
            <span>{customer.email}</span>
            {customer.phone && (
              <>
                <span>•</span>
                <span>{customer.phone}</span>
              </>
            )}
            {customer.city && (
              <>
                <span>•</span>
                <span>{customer.city}</span>
              </>
            )}
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-2 text-sm">
            <span>Sales rep: {customer.userDisplayName || customer.userEmail}</span>
            <span>•</span>
            <span>Added {format(customer.createdAt, 'PPP')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Pipeline details */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Interested in</p>
          <p className="text-sm font-medium">{customer.interestedInModel || '—'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Last contacted</p>
          <p className="text-sm font-medium">
            {customer.lastContactedAt ? format(customer.lastContactedAt, 'PPP') : '—'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Last updated</p>
          <p className="text-sm font-medium">{format(customer.updatedAt, 'PPP')}</p>
        </div>
      </div>

      {/* Notes */}
      <Field>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <FieldContent>
          <Textarea
            id="notes"
            defaultValue={customer.notes ?? ''}
            onBlur={(e) => handleNotesUpdate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur();
              }
            }}
            className={cn(
              'min-h-24 max-w-md cursor-text resize-none border-transparent px-3 text-sm transition-all',
              'bg-transparent dark:bg-transparent',
              'focus:border-input dark:focus:border-input hover:bg-muted/50'
            )}
            placeholder="Trade-in vehicle, financing preferences, test drive feedback..."
          />
        </FieldContent>
      </Field>

      {/* Edit Customer Dialog */}
      <CustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={async (values) => {
          await updateCustomer({
            id: resolvedParams.customerId,
            organizationId: activeOrgId,
            ...values,
          });
          utils.customers.get.invalidate({
            id: resolvedParams.customerId,
            organizationId: activeOrgId,
          });
        }}
        initialValues={{
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone ?? undefined,
          city: customer.city ?? undefined,
          status: customer.status,
          interestedInModel: customer.interestedInModel ?? undefined,
          lastContactedAt: customer.lastContactedAt ?? undefined,
          notes: customer.notes ?? undefined,
        }}
        mode="edit"
        isSubmitting={isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {customer.firstName} {customer.lastName}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
