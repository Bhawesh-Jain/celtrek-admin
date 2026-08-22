"use client";

import { Column, DataTable } from "@/components/data-table/data-table";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Card,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGlobalDialog } from "@/providers/DialogProvider";
import {
  getLeadList,
  getLeadStats,
  deleteLead,
  updateLeadStatus,
} from "@/lib/actions/lead";
import formatDate from "@/lib/utils/date";
import { Button, ButtonTooltip } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye,
  Trash2,
  Phone,
  Mail,
  Search,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { encryptIdForUrl } from "@/lib/utils/crypto";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserList } from "@/lib/actions/user";
import { User } from "@/lib/repositories/sys/userRepository";

interface Lead {
  lead_id: number;
  name: string;
  phone: string;
  email: string | null;
  company_name: string | null;
  product_id: number | null;
  product_name: string | null;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  source: string;
  assigned_to_name: string | null;
  activity_count: number;
  created_on: string;
}

const STATUS_CONFIG: Record<
  Lead["status"],
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  contacted: {
    label: "Contacted",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  qualified: {
    label: "Qualified",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
  converted: {
    label: "Converted",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  lost: {
    label: "Lost",
    className: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${className}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadListPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [stats, setStats] = useState({
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
  });
  const [reload, setReload] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { showError, showDeleteConfirmation, setDialogLoading, showSuccess } =
    useGlobalDialog();
  const pathname = usePathname();
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const result = await getUserList();
      if (result.success) {
        const userList = result.result;

        userList.map((user: any) => {
          user.name = `${user.name} (${user.role_name})`;
          return user;
        });

        setUsers(userList);
      }
    })();
  }, []);

  useEffect(() => {
    if (!reload) return;
    (async () => {
      setIsLoading(true);
      try {
        const [listResult, statsResult] = await Promise.all([
          getLeadList({
            status: statusFilter === "all" ? undefined : statusFilter,
            assigned_to: userFilter === "all" ? undefined : userFilter,
            search: search || undefined,
            page: 1,
            limit: 100,
          }),
          getLeadStats(),
        ]);
        setItems(listResult.result?.items || []);
        if (statsResult.success) setStats(statsResult.result);
      } catch (error: any) {
        showError("Request Failed!", error?.message || error.toString());
      } finally {
        setIsLoading(false);
        setReload(false);
      }
    })();
  }, [reload, statusFilter, search]);

  const itemsRef = useRef<Lead[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const onStatusChange = useCallback(
    async (leadId: number, newStatus: string) => {
      const currentItems = itemsRef.current;
      const currentItem = currentItems.find((item) => item.lead_id === leadId);
      if (!currentItem) return;
      const previousStatus = currentItem.status;

      setItems((prev) =>
        prev.map((item) =>
          item.lead_id === leadId
            ? { ...item, status: newStatus as Lead["status"] }
            : item,
        ),
      );

      try {
        const result = await updateLeadStatus(String(leadId), newStatus);
        if (!result.success) {
          setItems((prev) =>
            prev.map((item) =>
              item.lead_id === leadId
                ? { ...item, status: previousStatus }
                : item,
            ),
          );
          showError("Request Failed!", result.message);
        } else {
          setReload(true); // refresh stat counts
        }
      } catch (error: any) {
        setItems((prev) =>
          prev.map((item) =>
            item.lead_id === leadId
              ? { ...item, status: previousStatus }
              : item,
          ),
        );
        showError("Request Failed!", error?.message || error.toString());
      }
    },
    [showError],
  );

  const deleteLeadFunc = async (lead: Lead) => {
    showDeleteConfirmation(
      `Delete lead from ${lead.name}?`,
      "Are you sure you want to delete this lead? This will also remove its full activity history. This action is irreversible.",
      async () => {
        try {
          setDialogLoading(true);
          const result = await deleteLead(String(lead.lead_id));
          if (result.success) {
            showSuccess("Request Successful", "Lead deleted.");
            setReload(true);
          } else {
            showError("Error", result.message);
          }
        } catch (error: any) {
          showError("Error", "Something went wrong!");
        } finally {
          setDialogLoading(false);
        }
      },
    );
  };

  const columns: Column<Lead>[] = [
    {
      id: "name",
      header: "Contact",
      accessorKey: "name",
      sortable: true,
      visible: true,
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.name}</span>
          {row.company_name && (
            <span className="text-xs text-muted-foreground">
              {row.company_name}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "phone",
      header: "Contact Info",
      accessorKey: "phone",
      sortable: false,
      visible: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5 text-sm">
          <a
            href={`tel:${row.phone}`}
            className="flex items-center gap-1.5 hover:text-primary"
          >
            <Phone className="h-3 w-3" /> {row.phone}
          </a>
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <Mail className="h-3 w-3" /> {row.email}
            </a>
          )}
        </div>
      ),
    },
    {
      id: "product_name",
      header: "Product Interest",
      accessorKey: "product_name",
      sortable: true,
      visible: true,
      cell: (row) =>
        row.product_name || (
          <span className="text-muted-foreground text-xs">General Inquiry</span>
        ),
    },
    {
      id: "source",
      header: "Source",
      accessorKey: "source",
      sortable: true,
      visible: true,
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.source.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "assigned_to_name",
      header: "Assigned To",
      accessorKey: "assigned_to_name",
      sortable: true,
      visible: true,
      cell: (row) =>
        row.assigned_to_name || (
          <span className="text-muted-foreground text-xs">Unassigned</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      visible: true,
      cell: (row) => (
        <Select
          value={row.status}
          onValueChange={(value) => onStatusChange(row.lead_id, value)}
        >
          <SelectTrigger className="w-[130px] h-8 border-none shadow-none p-0">
            <SelectValue>
              <Badge className={STATUS_CONFIG[row.status].className}>
                {STATUS_CONFIG[row.status].label}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
              <SelectItem key={value} value={value}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "created_on",
      header: "Received",
      accessorKey: "created_on",
      sortable: true,
      visible: true,
      cell: (row) =>
        row.created_on
          ? formatDate(row.created_on.toString(), "dd-MM-yyyy")
          : "N/A",
    },
    {
      id: "lead_id",
      header: "Actions",
      accessorKey: "lead_id",
      sortable: false,
      visible: true,
      align: "right",
      cell: (row) => (
        <div>
          <Link
            href={`${pathname}/${encryptIdForUrl(String(row.lead_id))}?h=Lead Details`}
          >
            <ButtonTooltip title="View Lead" variant={"ghost"} size={"icon"}>
              <Eye />
            </ButtonTooltip>
          </Link>
          <ButtonTooltip
            title="Delete Lead"
            variant={"ghost"}
            className="text-destructive"
            size={"icon"}
            onClick={() => deleteLeadFunc(row)}
          >
            <Trash2 />
          </ButtonTooltip>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <CardHeader>
        <div className="flex flex-col space-y-1.5">
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>
            Track and follow up on catalogue inquiries
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard
            icon={Users}
            label="New"
            value={stats.new}
            className="bg-blue-100 text-blue-700"
          />
          <StatCard
            icon={Clock}
            label="Contacted"
            value={stats.contacted}
            className="bg-amber-100 text-amber-700"
          />
          <StatCard
            icon={TrendingUp}
            label="Qualified"
            value={stats.qualified}
            className="bg-purple-100 text-purple-700"
          />
          <StatCard
            icon={CheckCircle2}
            label="Converted"
            value={stats.converted}
            className="bg-green-100 text-green-700"
          />
          <StatCard
            icon={XCircle}
            label="Lost"
            value={stats.lost}
            className="bg-gray-100 text-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setReload(true)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setReload(true);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={userFilter}
            onValueChange={(v) => {
              setUserFilter(v);
              setReload(true);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => {
                return (
                  <SelectItem
                    key={user.id.toString()}
                    value={user.id.toString()}
                  >
                    {user.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setReload(true)}>
            Refresh
          </Button>
        </div>

        <DataTable
          data={items}
          columns={columns}
          fillEmpty={true}
          loading={isLoading}
          setReload={setReload}
        />
      </CardContent>
    </Container>
  );
}
