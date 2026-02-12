"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { useTranslation } from "@/lib/i18n"
import type { ServiceRequest } from "@/lib/types"
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Timer,
  CheckCircle2,
} from "lucide-react"
import { formatDistanceToNow, differenceInHours, format } from "date-fns"
import useSWR, { mutate } from "swr"
import { useState } from "react"

interface SlaViolationRow {
  id: string
  request_id: string
  worker_id: string | null
  delay_hours: number
  created_at: string
  request: ServiceRequest & { category: { name: string } | null }
  worker: { full_name: string | null } | null
}

async function fetchOverdueRequests(): Promise<ServiceRequest[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("service_requests")
    .select("*, category:categories(*)")
    .eq("status", "overdue")
    .order("sla_deadline", { ascending: true })
  return (data ?? []) as ServiceRequest[]
}

async function fetchAtRiskRequests(): Promise<ServiceRequest[]> {
  const supabase = createClient()
  const now = new Date()
  const soon = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from("service_requests")
    .select("*, category:categories(*)")
    .not("status", "in", '("resolved","closed","overdue")')
    .not("sla_deadline", "is", null)
    .lt("sla_deadline", soon)
    .gt("sla_deadline", now.toISOString())
    .order("sla_deadline", { ascending: true })
  return (data ?? []) as ServiceRequest[]
}

async function fetchViolations(): Promise<SlaViolationRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("sla_violations")
    .select("*, request:service_requests(*, category:categories(*)), worker:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(20)
  return (data ?? []) as SlaViolationRow[]
}

async function fetchAllRequests(): Promise<ServiceRequest[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("service_requests")
    .select("id, status, sla_deadline")
  return (data ?? []) as ServiceRequest[]
}

export default function SlaPage() {
  const { t } = useTranslation()
  const [checking, setChecking] = useState(false)
  const [lastResult, setLastResult] = useState<{ checked: number; marked: number; violations: number } | null>(null)

  const { data: overdue = [], isLoading: loadingOverdue } = useSWR("sla-overdue", fetchOverdueRequests)
  const { data: atRisk = [], isLoading: loadingAtRisk } = useSWR("sla-at-risk", fetchAtRiskRequests)
  const { data: violations = [], isLoading: loadingViolations } = useSWR("sla-violations", fetchViolations)
  const { data: allRequests = [] } = useSWR("sla-all", fetchAllRequests)

  const isLoading = loadingOverdue || loadingAtRisk || loadingViolations

  const totalWithDeadline = allRequests.filter((r) => r.sla_deadline).length
  const overdueCount = overdue.length
  const complianceRate = totalWithDeadline > 0 ? Math.round(((totalWithDeadline - overdueCount) / totalWithDeadline) * 100) : 100

  async function runSlaCheck() {
    setChecking(true)
    try {
      const res = await fetch("/api/sla/check", { method: "POST" })
      const data = await res.json()
      setLastResult(data)
      mutate("sla-overdue")
      mutate("sla-at-risk")
      mutate("sla-violations")
      mutate("sla-all")
    } finally {
      setChecking(false)
    }
  }

  function getTimeRemaining(deadline: string) {
    const now = new Date()
    const dl = new Date(deadline)
    const hoursLeft = differenceInHours(dl, now)
    if (hoursLeft < 0) {
      return { text: `${Math.abs(hoursLeft)}h overdue`, urgent: true }
    }
    if (hoursLeft < 4) {
      return { text: `${hoursLeft}h remaining`, urgent: true }
    }
    return { text: formatDistanceToNow(dl, { addSuffix: true }), urgent: false }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("sla.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sla.subtitle")}</p>
        </div>
        <Button onClick={runSlaCheck} disabled={checking} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? t("sla.checking") : t("sla.run_check")}
        </Button>
      </div>

      {lastResult && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="text-sm">
              {t("sla.check_result")}: {lastResult.checked} {t("sla.checked")}, {lastResult.marked} {t("sla.marked_overdue")}, {lastResult.violations} {t("sla.new_violations")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">{t("sla.overdue_requests")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atRisk.length}</p>
              <p className="text-xs text-muted-foreground">{t("sla.at_risk")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{complianceRate}%</p>
              <p className="text-xs text-muted-foreground">{t("sla.compliance_rate")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t("sla.overdue_title")} ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdue.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("sla.no_overdue")}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {overdue.map((r) => {
                  const remaining = r.sla_deadline ? getTimeRemaining(r.sla_deadline) : null
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.category?.name} &middot; {remaining?.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={r.priority} />
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* At Risk (within 4h of deadline) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-4 w-4 text-warning" />
              {t("sla.at_risk_title")} ({atRisk.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRisk.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("sla.no_at_risk")}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {atRisk.map((r) => {
                  const remaining = r.sla_deadline ? getTimeRemaining(r.sla_deadline) : null
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-md border border-warning/20 bg-warning/5 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.category?.name} &middot; {remaining?.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={r.priority} />
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Violations Log */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            {t("sla.violations_log")} ({violations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("sla.no_violations")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t("sla.col_request")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("sla.col_worker")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("sla.col_delay")}</th>
                    <th className="pb-2 font-medium">{t("sla.col_date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <p className="truncate font-medium">{v.request?.title || v.request_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{v.request?.category?.name}</p>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {v.worker?.full_name || t("sla.unassigned")}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <Clock className="h-3 w-3" />
                          {v.delay_hours}h
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {format(new Date(v.created_at), "MMM d, HH:mm")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
