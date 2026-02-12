"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import type { WorkerRanking } from "@/lib/types"
import {
  Trophy,
  Medal,
  Star,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { useState } from "react"

async function fetchRankings(): Promise<WorkerRanking[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, completed_tasks, sla_violations, average_rating, total_score")
    .eq("role", "worker")
    .order("total_score", { ascending: false })
  return (data ?? []) as WorkerRanking[]
}

function getRankIcon(index: number) {
  if (index === 0) return <Trophy className="h-5 w-5 text-amber-500" />
  if (index === 1) return <Medal className="h-5 w-5 text-zinc-400" />
  if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />
  return <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">#{index + 1}</span>
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 40) return "text-primary"
  if (score >= 20) return "text-warning"
  return "text-destructive"
}

export default function RankingsPage() {
  const { t } = useTranslation()
  const [recalculating, setRecalculating] = useState(false)
  const { data: rankings = [], isLoading } = useSWR("worker-rankings", fetchRankings)

  const totalWorkers = rankings.length
  const totalCompleted = rankings.reduce((s, w) => s + (w.completed_tasks || 0), 0)
  const totalViolations = rankings.reduce((s, w) => s + (w.sla_violations || 0), 0)
  const avgScore = totalWorkers > 0 ? Math.round(rankings.reduce((s, w) => s + (w.total_score || 0), 0) / totalWorkers) : 0

  async function recalculateScores() {
    setRecalculating(true)
    try {
      await fetch("/api/workers/rankings", { method: "POST" })
      mutate("worker-rankings")
    } finally {
      setRecalculating(false)
    }
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
          <h1 className="text-2xl font-bold tracking-tight">{t("rankings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("rankings.subtitle")}</p>
        </div>
        <Button onClick={recalculateScores} disabled={recalculating} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? t("rankings.recalculating") : t("rankings.recalculate")}
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWorkers}</p>
              <p className="text-xs text-muted-foreground">{t("rankings.total_workers")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">{t("rankings.total_completed")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalViolations}</p>
              <p className="text-xs text-muted-foreground">{t("rankings.total_violations")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgScore}</p>
              <p className="text-xs text-muted-foreground">{t("rankings.avg_score")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t("rankings.leaderboard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("rankings.no_workers")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t("rankings.col_rank")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("rankings.col_worker")}</th>
                    <th className="pb-2 pr-4 font-medium text-center">{t("rankings.col_completed")}</th>
                    <th className="pb-2 pr-4 font-medium text-center">{t("rankings.col_violations")}</th>
                    <th className="pb-2 pr-4 font-medium text-center">{t("rankings.col_rating")}</th>
                    <th className="pb-2 font-medium text-right">{t("rankings.col_score")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((w, i) => (
                    <tr
                      key={w.id}
                      className={`border-b last:border-0 ${i < 3 ? "bg-muted/30" : ""}`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(i)}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{w.full_name || t("rankings.unnamed")}</p>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          {w.completed_tasks || 0}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className={`inline-flex items-center gap-1 ${(w.sla_violations || 0) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          <AlertTriangle className="h-3 w-3" />
                          {w.sla_violations || 0}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Star className="h-3 w-3" />
                          {(w.average_rating || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-lg font-bold ${getScoreColor(w.total_score || 0)}`}>
                          {w.total_score || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Formula */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t("rankings.formula_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="font-mono text-sm">
              {"Score = (completed_tasks x 10) - (sla_violations x 15) + (average_rating x 5)"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("rankings.formula_desc")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
