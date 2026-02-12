"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import type { WorkerRanking } from "@/lib/types"
import {
  Trophy,
  Medal,
  Star,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  User,
} from "lucide-react"
import useSWR from "swr"
import { useEffect, useState } from "react"

async function fetchRankings(): Promise<WorkerRanking[]> {
  const res = await fetch("/api/workers/rankings")
  if (!res.ok) return []
  return res.json()
}

function getRankIcon(index: number) {
  if (index === 0) return <Trophy className="h-5 w-5 text-amber-500" />
  if (index === 1) return <Medal className="h-5 w-5 text-zinc-400" />
  if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />
  return (
    <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">
      #{index + 1}
    </span>
  )
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success"
  if (score >= 40) return "text-primary"
  if (score >= 20) return "text-warning"
  return "text-destructive"
}

export default function WorkerRankingsPage() {
  const { t } = useTranslation()
  const { data: rankings = [], isLoading } = useSWR("worker-rankings", fetchRankings)
  const [myId, setMyId] = useState<string | null>(null)

  useEffect(() => {
    async function getMyId() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setMyId(user.id)
    }
    getMyId()
  }, [])

  const myRankIndex = rankings.findIndex((w) => w.id === myId)
  const myStats = myRankIndex >= 0 ? rankings[myRankIndex] : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("rankings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("rankings.subtitle")}</p>
      </div>

      {/* My Stats Card */}
      {myStats && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-primary" />
              {t("rankings.my_stats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="flex flex-col items-center rounded-lg bg-background p-3">
                <div className="mb-1 flex items-center gap-1">
                  {getRankIcon(myRankIndex)}
                </div>
                <p className="text-xs text-muted-foreground">{t("rankings.col_rank")}</p>
                <p className="text-lg font-bold">#{myRankIndex + 1}</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3">
                <CheckCircle2 className="mb-1 h-5 w-5 text-success" />
                <p className="text-xs text-muted-foreground">{t("rankings.col_completed")}</p>
                <p className="text-lg font-bold">{myStats.completed_tasks || 0}</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3">
                <AlertTriangle className="mb-1 h-5 w-5 text-destructive" />
                <p className="text-xs text-muted-foreground">{t("rankings.col_violations")}</p>
                <p className="text-lg font-bold">{myStats.sla_violations || 0}</p>
              </div>
              <div className="flex flex-col items-center rounded-lg bg-background p-3">
                <Star className="mb-1 h-5 w-5 text-amber-500" />
                <p className="text-xs text-muted-foreground">{t("rankings.col_rating")}</p>
                <p className="text-lg font-bold">{(myStats.average_rating || 0).toFixed(1)}</p>
              </div>
              <div className="col-span-2 flex flex-col items-center rounded-lg bg-background p-3 sm:col-span-1">
                <TrendingUp className="mb-1 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">{t("rankings.col_score")}</p>
                <p className={`text-lg font-bold ${getScoreColor(myStats.total_score || 0)}`}>
                  {myStats.total_score || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t("rankings.leaderboard")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("rankings.no_workers")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t("rankings.col_rank")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("rankings.col_worker")}</th>
                    <th className="pb-2 pr-4 font-medium text-center">
                      {t("rankings.col_completed")}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-center">
                      {t("rankings.col_violations")}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-center">
                      {t("rankings.col_rating")}
                    </th>
                    <th className="pb-2 font-medium text-right">{t("rankings.col_score")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((w, i) => (
                    <tr
                      key={w.id}
                      className={`border-b last:border-0 ${
                        w.id === myId
                          ? "bg-primary/10 font-semibold"
                          : i < 3
                            ? "bg-muted/30"
                            : ""
                      }`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">{getRankIcon(i)}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {w.full_name || t("rankings.unnamed")}
                          {w.id === myId && (
                            <span className="ml-2 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                              {t("rankings.you")}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          {w.completed_tasks || 0}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            (w.sla_violations || 0) > 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
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
                        <span
                          className={`text-lg font-bold ${getScoreColor(w.total_score || 0)}`}
                        >
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
    </div>
  )
}
