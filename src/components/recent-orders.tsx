'use client';

import { Column, DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package2Icon, ExternalLinkIcon, EyeIcon } from "lucide-react";

interface OrderData {
  id: number;
  customer: string;
  amount: number;
  product: string;
  status: string;
  date: string;
  orderId: string;
}

const dummyData: OrderData[] = [
  {
    id: 1,
    customer: "Rohit Sharma",
    amount: 15000,
    product: "LG Refrigerator Model X",
    status: "delivered",
    date: "2025-05-10",
    orderId: "ORD123456"
  },
  {
    id: 2,
    customer: "Priya Patel",
    amount: 7500,
    product: "Samsung TV 55-inch",
    status: "processing",
    date: "2025-05-14",
    orderId: "ORD123457"
  },
  {
    id: 3,
    customer: "Amit Verma",
    amount: 25000,
    product: "iPhone 16 Pro Max",
    status: "shipped",
    date: "2025-05-13",
    orderId: "ORD123458"
  },
  {
    id: 4,
    customer: "Neha Gupta",
    amount: 12000,
    product: "Dell Laptop XPS 13",
    status: "delivered",
    date: "2025-05-12",
    orderId: "ORD123459"
  },
  {
    id: 5,
    customer: "Sanjay Singh",
    amount: 18000,
    product: "Sony Home Theater System",
    status: "cancelled",
    date: "2025-05-11",
    orderId: "ORD123460"
  },
];

export function RecentOrders({ onViewOrderHistory }: { onViewOrderHistory: (id: number) => void }) {
  const columns: Column<OrderData>[] = [
    {
      id: "orderId",
      header: "Order ID",
      accessorKey: "orderId",
      sortable: true,
      visible: true,
    },
    {
      id: "customer",
      header: "Customer",
      accessorKey: "customer",
      sortable: true,
      visible: true,
    },
    {
      id: "product",
      header: "Product",
      accessorKey: "product",
      visible: true,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Package2Icon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate max-w-[180px]">{row.product}</span>
        </div>
      )
    },
    {
      id: "amount",
      header: "Amount",
      visible: true,
      accessorKey: "amount",
      cell: (row) => `₹${row.amount.toLocaleString()}`
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      visible: true,
      cell: (row) => (
        <Badge
          variant={
            row.status === 'delivered' ? 'success' :
              row.status === 'shipped' ? 'default' :
                row.status === 'processing' ? 'secondary' :
                  row.status === 'cancelled' ? 'destructive' : 'outline'
          }
          className="capitalize"
        >
          {row.status}
        </Badge>
      )
    },
    {
      id: "date",
      header: "Date",
      visible: true,
      accessorKey: "date",
      cell: (row) => new Date(row.date).toLocaleDateString('en-IN')
    },
    {
      id: "actions",
      header: "",
      visible: true,
      accessorKey: "date",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewOrderHistory(row.id)}
          className="flex items-center gap-1"
        >
          <EyeIcon className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-1">Details</span>
        </Button>
      )
    }
  ];

  return (
    <DataTable
      data={dummyData}
      columns={columns}
      pageSize={3}
      searchable={false}
      toolbar={false}
      className="border-0"
    />
  );
}