import React, { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowUpDownIcon, ChevronDown, ChevronUp, Settings2, SortAscIcon, SortDescIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "../icons"

export interface Column<T> {
  id: string
  header: string
  align?: 'center' | 'left' | 'right' | 'justify' | 'char'
  accessorKey: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  noWrap?: boolean
  filterable?: boolean
  visible: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageSize?: number
  searchable?: boolean
  serialShow?: boolean
  className?: string
  loading?: boolean
  toolbar?: boolean
  fillEmpty?: boolean
  setReload?: (reload: boolean) => void
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns: defaultColumns,
  pageSize = 10,
  searchable = true,
  serialShow = true,
  className,
  loading = false,
  fillEmpty = false,
  toolbar = true,
  setReload
}: DataTableProps<T>) {
  // State management
  const [columns, setColumns] = useState<Column<T>[]>(() => [
    {
      id: '__serial__',
      header: '#',
      accessorKey: '__serial__' as keyof T,
      visible: serialShow,
      sortable: false,
      filterable: false,
      align: 'left',
    },
    ...defaultColumns,
  ])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: "asc" | "desc" | null
  }>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)

  // Column visibility toggle
  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  }

  // Sorting logic
  const handleSort = (key: keyof T) => {
    setSortConfig(current => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    try {
      let filtered = [...data]

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      }

      // Sort
      if (sortConfig.key && sortConfig.direction) {
        filtered.sort((a, b) => {
          const aValue = a[sortConfig.key!]
          const bValue = b[sortConfig.key!]

          if (typeof aValue === "string" && typeof bValue === "string") {
            return sortConfig.direction === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }

          return sortConfig.direction === "asc"
            ? aValue > bValue
              ? 1
              : -1
            : bValue > aValue
              ? 1
              : -1
        })
      }

      return filtered
    } catch (error) {
      return [];
    }
  }, [data, searchTerm, sortConfig])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-4">
      <div className="flex md:flex-row flex-col md:items-center items-start justify-between gap-2">
        {searchable && (
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs "
          />
        )}
        <div className="flex flex-row md:items-center items-start justify-end gap-2">
          {toolbar && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 overflow-y-auto">
              {columns.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.visible !== false}
                  onCheckedChange={() => toggleColumnVisibility(column.id)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>}
          {setReload && <Button variant="outline" size="sm" onClick={() => setReload(true)}><Icons.reload className={cn(loading && 'animate-spin')} /></Button>}
        </div>
      </div>

      <div className={cn("rounded-md border", className)}>
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {columns
                .filter(col => col.visible !== false)
                .map((column) => {
                  return (
                    <TableHead
                      key={column.id}
                      className={cn(column.sortable && "cursor-pointer")}
                      align={column.align || 'left'}
                      onClick={() =>
                        column.sortable && handleSort(column.accessorKey)
                      }
                    >
                      <div className={cn("flex gap-2 select-none text-nowrap items-center",
                        column.align == 'right'
                          ? 'justify-end mr-2'
                          : column.align == 'center'
                            ? 'justify-center mr-2'
                            : 'justify-start')}>
                        {column.header}
                        {column.sortable && (sortConfig.key === column.accessorKey ? (
                          {
                            asc: <SortAscIcon className="h-3 w-3" />,
                            desc: <SortDescIcon className="h-3 w-3" />,
                          }[sortConfig.direction!]
                        ) : <ArrowUpDownIcon className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading ? (
              paginatedData && paginatedData.length > 0 ? paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns
                    .filter(col => col.visible !== false)
                    .map(column => {
                      if (column.id === '__serial__') {
                        return (
                          <TableCell key={column.id} align={column.align || 'right'}>
                            {(currentPage - 1) * pageSize + rowIndex + 1}
                          </TableCell>
                        )
                      }
                      return (
                        <TableCell key={column.id} className={cn(column.noWrap && 'whitespace-nowrap')} align={column.align || 'left'}>
                          {column.cell
                            ? column.cell(row)
                            : String(row[column.accessorKey] ? row[column.accessorKey] : fillEmpty ? '---' : '')}
                        </TableCell>
                      )
                    })}
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center gap-2 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data</p>
                    {setReload && <Button className="mt-4" variant="outline" size="sm" onClick={() => setReload(true)}>Reload</Button>}
                  </TableCell>
                </TableRow>
              )
            ) :
              (
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    {columns
                      .filter(col => col.visible !== false)
                      .map(column => (
                        <TableCell key={column.id}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                  </TableRow>
                )))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}