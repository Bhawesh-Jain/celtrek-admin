'use client'

import { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Container } from "@/components/ui/container"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import Loading from "@/app/dashboard/loading"
import {
  Package,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Check,
  FilterX,
  ArrowUpDown,
  Tag,
  Printer
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { encryptIdForUrl } from "@/lib/utils/crypto"
import { Order } from "@/types/order"


// Mock data - replace with API calls
const MOCK_ORDERS: Order[] = [
  {
    order_id: 1001,
    order_number: "ORD-2024-001",
    customer_name: "John Doe",
    customer_email: "john@example.com",
    customer_phone: "+1 234 567 8900",
    total_amount: 149.99,
    subtotal_amount: 129.99,
    tax_amount: 12.00,
    shipping_amount: 8.00,
    discount_amount: 0,
    payment_status: 'paid',
    fulfillment_status: 'processing',
    order_status: 'confirmed',
    payment_method: 'credit_card',
    shipping_method: 'standard',
    shipping_address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      postal_code: "10001"
    },
    billing_address: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      country: "USA",
      postal_code: "10001"
    },
    notes: "Handle with care",
    tags: ["new", "priority"],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    items: [
      {
        item_id: 1,
        product_id: 101,
        product_name: "Premium T-Shirt",
        variant_name: "Large / Black",
        sku: "TSHIRT-L-BLK",
        quantity: 2,
        unit_price: 29.99,
        total_price: 59.98
      },
      {
        item_id: 2,
        product_id: 102,
        product_name: "Wireless Headphones",
        sku: "HP-WL-001",
        quantity: 1,
        unit_price: 69.99,
        total_price: 69.99
      }
    ],
    platform: "Shopify"
  },
  {
    order_id: 1002,
    order_number: "ORD-2024-002",
    customer_name: "Jane Smith",
    customer_email: "jane@example.com",
    total_amount: 89.50,
    subtotal_amount: 79.50,
    tax_amount: 6.00,
    shipping_amount: 4.00,
    discount_amount: 0,
    payment_status: 'pending',
    fulfillment_status: 'pending',
    order_status: 'pending',
    payment_method: 'paypal',
    created_at: "2024-01-14T14:20:00Z",
    updated_at: "2024-01-14T14:20:00Z",
    items: [
      {
        item_id: 1,
        product_id: 103,
        product_name: "Coffee Mug",
        sku: "MUG-001",
        quantity: 3,
        unit_price: 15.00,
        total_price: 45.00
      },
      {
        item_id: 2,
        product_id: 104,
        product_name: "Desk Organizer",
        sku: "DORG-001",
        quantity: 1,
        unit_price: 34.50,
        total_price: 34.50
      }
    ],
    platform: "WooCommerce"
  },
  // Add more mock orders as needed
]

// Status badges
const PaymentStatusBadge = ({ status }: { status: Order['payment_status'] }) => {
  const config = {
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
    paid: { label: 'Paid', variant: 'success' as const, icon: CheckCircle },
    failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
    refunded: { label: 'Refunded', variant: 'secondary' as const, icon: RefreshCw }
  }

  const { label, variant, icon: Icon } = config[status]
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const FulfillmentStatusBadge = ({ status }: { status: Order['fulfillment_status'] }) => {
  const config = {
    pending: { label: 'Pending', variant: 'outline' as const, icon: Clock },
    processing: { label: 'Processing', variant: 'secondary' as const, icon: RefreshCw },
    shipped: { label: 'Shipped', variant: 'secondary' as const, icon: Truck },
    delivered: { label: 'Delivered', variant: 'success' as const, icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle }
  }

  const { label, variant, icon: Icon } = config[status]
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const OrderStatusBadge = ({ status }: { status: Order['order_status'] }) => {
  const config = {
    pending: { label: 'Pending', variant: 'outline' as const, icon: Clock },
    confirmed: { label: 'Confirmed', variant: 'secondary' as const, icon: Check },
    processing: { label: 'Processing', variant: 'secondary' as const, icon: RefreshCw },
    completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle }
  }

  const { label, variant, icon: Icon } = config[status]
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  )
}

const getOrders = async (filters?: any) => {
  // Simulate API call
  return new Promise<{ success: boolean; result: Order[]; total: number }>((resolve) => {
    setTimeout(() => {
      // Apply filters (in real app, this would be done on backend)
      let filteredOrders = [...MOCK_ORDERS]
      
      if (filters?.search) {
        const search = filters.search.toLowerCase()
        filteredOrders = filteredOrders.filter(order => 
          order.order_number.toLowerCase().includes(search) ||
          order.customer_name.toLowerCase().includes(search) ||
          order.customer_email.toLowerCase().includes(search)
        )
      }
      
      if (filters?.status && filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.order_status === filters.status)
      }
      
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.payment_status === filters.paymentStatus)
      }
      
      if (filters?.platform && filters.platform !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.platform === filters.platform)
      }
      
      resolve({
        success: true,
        result: filteredOrders,
        total: filteredOrders.length
      })
    }, 500)
  })
}

export default function OrdersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    platform: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getOrders({ ...filters, search: searchQuery })
      setOrders(result.result)
      setTotalOrders(result.total)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters, searchQuery, toast])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle row selection
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(order => order.order_id))
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to perform this action",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Success",
        description: `${action} applied to ${selectedOrders.length} order(s)`,
      })
      
      setSelectedOrders([])
      fetchOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} orders`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
    
    const sortedOrders = [...orders].sort((a, b) => {
      let aValue: any = a[key as keyof Order]
      let bValue: any = b[key as keyof Order]
      
      if (key === 'created_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
    
    setOrders(sortedOrders)
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      paymentStatus: 'all',
      platform: 'all',
      dateFrom: '',
      dateTo: ''
    })
    setSearchQuery("")
  }

  // Export orders
  const exportOrders = () => {
    const data = selectedOrders.length > 0 
      ? orders.filter(order => selectedOrders.includes(order.order_id))
      : orders
    
    // In real app, this would be an API call to export data
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Order ID", "Order Number", "Customer", "Total", "Status", "Created Date"].join(",") + "\n"
      + data.map(order => [
          order.order_id,
          order.order_number,
          order.customer_name,
          `$${order.total_amount.toFixed(2)}`,
          order.order_status,
          format(new Date(order.created_at), 'MMM dd, yyyy')
        ].join(",")).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `orders_${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export successful",
      description: `Exported ${data.length} order(s)`,
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Stats
  const stats = {
    total: totalOrders,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    completed: orders.filter(o => o.order_status === 'completed').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0)
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    )
  }

  return (
    <Container className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />
            Orders Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all your customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportOrders} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by ID, customer name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filters.status !== 'all' || filters.paymentStatus !== 'all' || filters.platform !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>
              {Object.values(filters).some(val => val !== 'all' && val !== '') && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="sm:w-auto"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Status</label>
                    <Select
                      value={filters.paymentStatus}
                      onValueChange={(value) => setFilters({ ...filters, paymentStatus: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All payment statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payment Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <Select
                      value={filters.platform}
                      onValueChange={(value) => setFilters({ ...filters, platform: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="Shopify">Shopify</SelectItem>
                        <SelectItem value="WooCommerce">WooCommerce</SelectItem>
                        <SelectItem value="Amazon">Amazon</SelectItem>
                        <SelectItem value="Etsy">Etsy</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedOrders.length} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrders([])}
                >
                  Clear selection
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select onValueChange={handleBulkAction}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Bulk actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mark_processing">Mark as Processing</SelectItem>
                    <SelectItem value="mark_shipped">Mark as Shipped</SelectItem>
                    <SelectItem value="mark_completed">Mark as Completed</SelectItem>
                    <SelectItem value="mark_cancelled">Mark as Cancelled</SelectItem>
                    <SelectItem value="print_labels">Print Shipping Labels</SelectItem>
                    <SelectItem value="export_selected">Export Selected</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('order_number')}
                  >
                    <div className="flex items-center gap-1">
                      Order ID
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('total_amount')}
                  >
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">No orders found</p>
                        {Object.values(filters).some(val => val !== 'all' && val !== '') && (
                          <Button variant="outline" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.order_id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.order_id)}
                          onCheckedChange={() => toggleOrderSelection(order.order_id)}
                          aria-label={`Select order ${order.order_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{order.order_number}</span>
                          <span className="text-xs text-muted-foreground">
                            ID: {order.order_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(order.created_at)}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.items.length} item(s)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customer_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.customer_email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{formatCurrency(order.total_amount)}</span>
                          <span className="text-xs text-muted-foreground">
                            {order.payment_method}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {order.platform}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.payment_status} />
                      </TableCell>
                      <TableCell>
                        <FulfillmentStatusBadge status={order.fulfillment_status} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.order_status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`${pathname}/${encryptIdForUrl(String(order.order_id))}?h=Order Details`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`${pathname}/${encryptIdForUrl(String(order.order_id))}/edit?h=Edit Order`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Truck className="h-4 w-4 mr-2" />
                              Create Shipping Label
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination (simplified) */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {orders.length} of {totalOrders} orders
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}