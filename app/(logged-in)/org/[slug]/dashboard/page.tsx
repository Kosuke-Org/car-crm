/**
 * Organization Dashboard
 * Dealership overview: customer pipeline metrics, recent customers and recent orders
 */

'use client';

import Link from 'next/link';

import { CalendarClock, ShoppingCart, SquareUser, UserPlus } from 'lucide-react';

import { useCustomerStats, useCustomersList } from '@/hooks/use-customers';
import { useOrdersList } from '@/hooks/use-orders';
import { useOrganization } from '@/hooks/use-organization';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { statusColors as customerStatusColors, statusOptions } from '../customers/utils';
import { statusColors as orderStatusColors } from '../orders/utils';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export default function OrgDashboardPage() {
  const { organization, isLoading: isLoadingOrg } = useOrganization();
  const organizationId = organization?.id;

  const { stats, isLoading: isLoadingStats } = useCustomerStats(organizationId);

  const { customers, isLoading: isLoadingCustomers } = useCustomersList(
    organizationId
      ? {
          organizationId,
          page: 1,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }
      : undefined
  );

  const { orders, isLoading: isLoadingOrders } = useOrdersList(
    organizationId
      ? {
          organizationId,
          page: 1,
          limit: 5,
          sortBy: 'orderDate',
          sortOrder: 'desc',
        }
      : undefined
  );

  if (isLoadingOrg || isLoadingStats || isLoadingCustomers || isLoadingOrders) {
    return <DashboardSkeleton />;
  }

  const orgPrefix = organization ? `/org/${organization.slug}` : '';
  const totalCustomers = stats?.total ?? 0;
  const openPipeline = (stats?.byStatus.lead ?? 0) + (stats?.byStatus.prospect ?? 0);

  const metrics = [
    {
      title: 'Total customers',
      value: totalCustomers,
      description: 'Across the whole dealership',
      icon: SquareUser,
    },
    {
      title: 'Open pipeline',
      value: openPipeline,
      description: 'Leads and prospects to follow up',
      icon: UserPlus,
    },
    {
      title: 'New this month',
      value: stats?.newThisMonth ?? 0,
      description: 'Customers added since the 1st',
      icon: CalendarClock,
    },
    {
      title: 'Contacted last 7 days',
      value: stats?.contactedLastWeek ?? 0,
      description: 'Recent sales rep touchpoints',
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dealership overview</h2>
          <p className="text-muted-foreground">
            Customer pipeline and latest activity for {organization?.name ?? 'your dealership'}
          </p>
        </div>
        <Button asChild>
          <Link href={`${orgPrefix}/customers`}>View customers</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-muted-foreground text-xs">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer pipeline</CardTitle>
            <CardDescription>Distribution of customers by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {totalCustomers === 0 ? (
              <p className="text-muted-foreground text-sm">No customers yet</p>
            ) : (
              statusOptions.map((option) => {
                const value = stats?.byStatus[option.value] ?? 0;

                return (
                  <div key={option.value} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted-foreground">
                        {value} ({Math.round((value / totalCustomers) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(value / totalCustomers) * 100} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent customers</CardTitle>
            <CardDescription>Latest people added to the dealership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No customers yet</p>
            ) : (
              customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`${orgPrefix}/customers/${customer.id}`}
                  className="hover:bg-muted/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2"
                >
                  <div className="space-y-1">
                    <p className="text-sm leading-none font-medium">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {customer.interestedInModel ?? customer.email}
                    </p>
                  </div>
                  <Badge variant="outline" className={customerStatusColors[customer.status]}>
                    {customer.status}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest vehicle orders and their status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet</p>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`${orgPrefix}/orders/${order.id}`}
                className="hover:bg-muted/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2"
              >
                <div className="space-y-1">
                  <p className="text-sm leading-none font-medium">{order.customerName}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    ${Number(order.amount).toLocaleString()}
                  </span>
                  <Badge variant="outline" className={orderStatusColors[order.status]}>
                    {order.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
