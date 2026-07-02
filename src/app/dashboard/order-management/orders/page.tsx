'use client'

import { Column, DataTable } from "@/components/data-table/data-table";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useEffect, useRef, useState } from "react";
import { useGlobalDialog } from "@/providers/DialogProvider";
import { getOrderList } from "@/lib/actions/order";
import formatDate from "@/lib/utils/date";
import { Button, ButtonTooltip } from "@/components/ui/button";
import { Order } from "@/lib/repositories/orderRepository";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Edit2, Trash2 } from "lucide-react";
import { encryptIdForUrl } from "@/lib/utils/crypto";
import { Badge } from "@/components/ui/badge";


export default function OrderListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [reload, setReload] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { showError, showDeleteConfirmation, setDialogLoading, showSuccess } = useGlobalDialog();
  const pathname = usePathname();

  useEffect(() => {
    if (!reload) return;
    (async () => {
      setIsLoading(true);
      setItems([]);
      try {
        const result = await getOrderList();
        setItems(result.result || []);
      } catch (error: any) {
        showError("Request Failed!", error?.message || error.toString());
      } finally {
        setIsLoading(false);
        setReload(false);
      }
    })();
  }, [reload]);

  const itemsRef = useRef<any[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const columns: Column<Order>[] = [
    {
      id: "order_code",
      header: "Order",
      accessorKey: "order_code",
      sortable: true,
      visible: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.order_code}</span>
          <span className="text-xs text-muted-foreground">
            {row.total_items} items
          </span>
        </div>
      ),
    },

    {
      id: "total_amount",
      header: "Amount",
      accessorKey: "total_amount",
      sortable: true,
      visible: true,
      cell: (row) => (
        <span className="font-semibold">
          ₹{row.total_amount.toLocaleString("en-IN")}
        </span>
      ),
    },

    {
      id: "payment_status",
      header: "Payment",
      accessorKey: "payment_status",
      sortable: true,
      visible: true,
      cell: (row) => {
        const statusMap: Record<number, { label: string; variant: any }> = {
          0: { label: "Pending", variant: "secondary" },
          1: { label: "Paid", variant: "success" },
          2: { label: "Failed", variant: "destructive" },
        };

        const status = statusMap[row.payment_status] ?? {
          label: "Unknown",
          variant: "outline",
        };

        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },

    {
      id: "delivery_status",
      header: "Delivery",
      accessorKey: "delivery_status",
      sortable: true,
      visible: true,
      cell: (row) => {
        const statusMap: Record<number, string> = {
          0: "Pending",
          1: "Processing",
          2: "Shipped",
          3: "Delivered",
        };

        return (
          <span className="text-sm">
            {statusMap[row.delivery_status] ?? "N/A"}
          </span>
        );
      },
    },
    {
      id: "created_on",
      header: "Created",
      accessorKey: "created_on",
      sortable: true,
      visible: true,
      cell: (row) =>
        row.created_on
          ? formatDate(row.created_on, "dd MMM yyyy")
          : "—",
    },
    {
      id: "order_id",
      header: "",
      accessorKey: "order_id",
      align: "right",
      visible: true,
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`${pathname}/edit/${encryptIdForUrl(
              String(row.order_id)
            )}?h=Edit Order`}
          >
            <ButtonTooltip title="Edit Order" variant="ghost" size="icon">
              <Edit2 className="h-4 w-4" />
            </ButtonTooltip>
          </Link>

          <ButtonTooltip
            title="Delete Order"
            variant="ghost"
            size="icon"
            className="text-destructive"
            // onClick={() => deleteOrderFunc(row)}
          >
            <Trash2 className="h-4 w-4" />
          </ButtonTooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      {
        <Container>
          <CardHeader>
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-col space-y-1.5">
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Manage your orders</CardDescription>
              </div>

              <Link href={`${pathname}/add?h=Add Order`}>
                <Button>
                  Add New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              fillEmpty={true}
              loading={isLoading}
              setReload={setReload}
            />
          </CardContent>
        </Container>
      }
    </>
  );
}