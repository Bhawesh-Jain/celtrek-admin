// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loading from "@/app/dashboard/loading";
import { getDashboardStats } from "@/lib/actions/dashboard";
import formatDate from "@/lib/utils/date";
import { encryptIdForUrl } from "@/lib/utils/crypto";
import {
  Package,
  Tags,
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Phone,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-700", icon: Users },
  contacted: { label: "Contacted", className: "bg-amber-100 text-amber-700", icon: Clock },
  qualified: { label: "Qualified", className: "bg-purple-100 text-purple-700", icon: TrendingUp },
  converted: { label: "Converted", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
  lost: { label: "Lost", className: "bg-gray-100 text-gray-500", icon: XCircle },
};

function KpiCard({ icon: Icon, label, value, href, className }: { icon: any; label: string; value: number; href?: string; className: string }) {
  const content = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${className}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-bold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function LeadStatusBar({ stats, total }: { stats: Record<string, number>; total: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-muted">
        {Object.entries(stats).map(([status, count]) => {
          if (!count) return null;
          const width = total > 0 ? (count / total) * 100 : 0;
          const colorMap: Record<string, string> = {
            new: "bg-blue-500",
            contacted: "bg-amber-500",
            qualified: "bg-purple-500",
            converted: "bg-green-500",
            lost: "bg-gray-400",
          };
          return <div key={status} className={colorMap[status]} style={{ width: `${width}%` }} />;
        })}
      </div>
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={status} className="flex items-center gap-1.5 text-sm">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{cfg.label}:</span>
              <span className="font-medium">{stats[status] ?? 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await getDashboardStats();
      if (result.success) setData(result.result);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading || !data) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <CardHeader className="px-0 pt-0">
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Overview of your catalogue and lead pipeline</CardDescription>
      </CardHeader>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Package} label="Products" value={data.product_count} href="/dashboard/product-management/products" className="bg-teal-100 text-teal-700" />
        <KpiCard icon={Tags} label="Categories" value={data.category_count} href="/dashboard/category-management/categories" className="bg-indigo-100 text-indigo-700" />
        <KpiCard icon={UserCheck} label="Total Leads" value={data.total_leads} href="/dashboard/order-management/leads" className="bg-orange-100 text-orange-700" />
        <KpiCard icon={Users} label="Team Members" value={data.user_count} href="/dashboard/settings/user-management" className="bg-slate-100 text-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead pipeline */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Lead Pipeline</CardTitle>
                <CardDescription>Where your leads stand right now</CardDescription>
              </div>
              <Link href="/dashboard/order-management/leads">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <LeadStatusBar stats={data.lead_stats} total={data.total_leads} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Leads</CardTitle>
                <CardDescription>Latest catalogue inquiries</CardDescription>
              </div>
              <Link href="/dashboard/order-management/leads">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.recent_leads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No leads yet.</p>
              ) : (
                <div className="flex flex-col divide-y">
                  {data.recent_leads.map((lead: any) => (
                    <Link
                      key={lead.lead_id}
                      href={`/dashboard/order-management/leads/${encryptIdForUrl(String(lead.lead_id))}?h=Lead Details`}
                      className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{lead.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                          {lead.product_name && <span className="ml-1">{lead.product_name}</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_CONFIG[lead.status]?.className}>
                          {STATUS_CONFIG[lead.status]?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground text-nowrap hidden sm:inline">
                          {formatDate(lead.created_on, 'dd-MM-yyyy')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — categories + recent products */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Top Categories</CardTitle>
                <CardDescription>By product count</CardDescription>
              </div>
              <Link href="/dashboard/category-management/categories">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.top_categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No categories yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.top_categories.map((cat: any) => (
                    <div key={cat.category_id} className="flex items-center justify-between">
                      <span className="text-sm truncate">{cat.category_name}</span>
                      <Badge variant="outline">{cat.item_count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recently Added</CardTitle>
                <CardDescription>Newest products</CardDescription>
              </div>
              <Link href="/dashboard/product-management/products">
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.recent_products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No products yet.</p>
              ) : (
                <div className="flex flex-col divide-y">
                  {data.recent_products.map((p: any) => (
                    <Link
                      key={p.product_id}
                      href={`/dashboard/product-management/products/edit/${encryptIdForUrl(String(p.product_id))}?h=Edit Product`}
                      className="flex items-center justify-between py-2.5 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <span className="text-sm truncate">{p.product_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatDate(p.created_on, 'dd-MM-yyyy')}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}