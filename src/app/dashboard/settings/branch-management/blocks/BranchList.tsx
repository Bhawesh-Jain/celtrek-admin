"use client"

import { DataTable, Column } from "@/components/data-table/data-table"
import formatDate from "@/lib/utils/date"
import { Button, ButtonTooltip } from "@/components/ui/button"
import { useEffect, useState } from "react"
import AddBranch from "./AddBranch"
import { disableBranch, getBranches } from "@/lib/actions/sys/settings"
import EditBranch from "./EditBranch"
import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Branch {
  id: number
  name: string
  branch_code: string
  location: string
  pincode: string
  status: "1" | "-1"
  created_on: string
}

export function BranchList() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [reload, setReload] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setReload(false);
      setLoading(true);

      const branches = await getBranches();
      setBranches(branches.result);

      setLoading(false);
    })();
  }, [reload]);

  const columns: Column<Branch>[] = [
    {
      id: "name",
      header: "Branch Name",
      accessorKey: "name",
      sortable: true,
      visible: true,
    },
    {
      id: "branch_code",
      header: "Code",
      accessorKey: "branch_code",
      sortable: true,
      visible: true,
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "location",
      visible: true,
    },
    {
      id: "pincode",
      header: "Pincode",
      accessorKey: "pincode",
      visible: true,
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      visible: true,
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${row.status == "1"
              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
            }`}
        >
          {row.status == "1" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "created_on",
      header: "Created On",
      accessorKey: "created_on",
      cell: (row) => formatDate(row.created_on),
      visible: true,
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      accessorKey: "id",
      visible: true,
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <EditBranch branchId={row.id} setReload={setReload} />
          <ButtonTooltip title={row.status == "-1" ? "Enable Branch" : "Disable Branch"} onClick={() => handleDisableBranch(row.id, row.status == "1" ? -1 : 1)} variant={"ghost"} size="icon">
            <RotateCcw className={cn(row.status == "-1" ? "text-green-500" : "text-red-500")} />
          </ButtonTooltip>
        </div>
      ),
    },
  ]

  const handleDisableBranch = async (id: number, status: number) => {
    const result = await disableBranch(id, status);
    if (result.success) {
      setReload(true);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Branches</h2>
        <AddBranch setReload={setReload} />
      </div>
      <DataTable data={branches} columns={columns} loading={loading} setReload={setReload} />
    </div>
  )
} 