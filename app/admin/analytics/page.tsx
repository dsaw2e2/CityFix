"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import type { ServiceRequest } from "@/lib/types"
import useSWR from "swr"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

async function fetchAllRequests(): Promise<ServiceRequest[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("service_requests")
    .select("*, category:categories(*)")
    .order("created_at", { ascending: false })
  return (data ?? []) as ServiceRequest[]
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "#6b7280",
  assigned: "#1a6dc2",
  in_progress: "#d97706",
  resolved: "#16a34a",
  closed: "#9ca3af",
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "#9ca3af",
  medium: "#1a6dc2",
  high: "#d97706",
  urgent: "#dc2626",
}

export default function AdminAnalyticsPage() {
  const { t } = useTranslation()
  const { data: requests = [], isLoading } = useSWR("admin-analytics", fetchAllRequests)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const statusData = Object.entries(
    requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: t(`status.${name}`),
    value,
    color: STATUS_COLORS[name] || "#6b7280",
  }))

  const categoryData = Object.entries(
    requests.reduce((acc, r) => {
      const cat = r.category?.name || "Other"
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const priorityData = Object.entries(
    requests.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: t(`priority.${name}`),
    value,
    color: PRIORITY_COLORS[name] || "#6b7280",
  }))

  const dailyData: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const count = requests.filter((r) => r.created_at.split("T")[0] === dateStr).length
    dailyData.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    })
  }

  const resolved = requests.filter((r) => r.status === "resolved" || r.status === "closed").length
  const resolutionRate = requests.length > 0 ? Math.round((resolved / requests.length) * 100) : 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("analytics.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">{requests.length}</p>
            <p className="text-sm text-muted-foreground">{t("analytics.total")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-success">{resolutionRate}%</p>
            <p className="text-sm text-muted-foreground">{t("analytics.resolution_rate")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-destructive">
              {requests.filter((r) => r.priority === "urgent" && r.status !== "resolved" && r.status !== "closed").length}
            </p>
            <p className="text-sm text-muted-foreground">{t("analytics.open_urgent")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("analytics.daily")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 14%, 89%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(213, 80%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("analytics.by_status")}</CardTitle></CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("analytics.no_data")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                    {statusData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("analytics.by_category")}</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("analytics.no_data")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 14%, 89%)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(160, 60%, 42%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("analytics.by_priority")}</CardTitle></CardHeader>
          <CardContent>
            {priorityData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("analytics.no_data")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                    {priorityData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
