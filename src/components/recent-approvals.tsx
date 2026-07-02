'use client';

import { Column, DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileTextIcon } from "lucide-react";

interface dum {
  id: number;
  customer: string;
  amount: number;
  product: string;
  status: string;
  date: string;
}

const dummyData = [
  {
    id: 1,
    customer: "Rahul Sharma",
    amount: 1500000,
    product: "Home Loan",
    status: "approved",
    date: "2024-03-15"
  },
  {
    id: 2,
    customer: "Priya Patel",
    amount: 750000,
    product: "Personal Loan",
    status: "pending",
    date: "2024-03-14"
  },
  {
    id: 3,
    customer: "Amit Verma",
    amount: 2500000,
    product: "Business Loan",
    status: "rejected",
    date: "2024-03-13"
  },
  {
    id: 4,
    customer: "Neha Gupta",
    amount: 1200000,
    product: "Education Loan",
    status: "approved",
    date: "2024-03-12"
  },
  {
    id: 5,
    customer: "Sanjay Singh",
    amount: 1800000,
    product: "Home Loan",
    status: "pending",
    date: "2024-03-11"
  },
];

const columns: Column<dum>[] = [
  {
    id: "customer",
    header: "Customer",
    accessorKey: "customer",
    sortable: true,
    visible: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <FileTextIcon className="h-4 w-4 text-muted-foreground" />
        <span>{row.customer}</span>
      </div>
    )
  },
  {
    id: "product",
    header: "Product",
    accessorKey: "product",
    visible: true,
    sortable: true
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
          row.status === 'approved' ? 'success' :
            row.status === 'rejected' ? 'destructive' : 'secondary'
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
  }
];

export function RecentApprovals() {
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