"use client"

import { StatusBadge } from "@/components/status-badge"
import { PriorityBadge } from "@/components/priority-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTranslation } from "@/lib/i18n"
import type {
  ServiceRequest,
  Profile,
  RequestStatus,
  RequestPriority,
} from "@/lib/types"
import {
  Search,
  MapPin,
  Clock,
  Tag,
  UserPlus,
  Loader2,
  BrainCircuit,
  Star,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

async function fetchAllRequests(): Promise<ServiceRequest[]> {
  const res = await fetch("/api/admin/requests")
  if (!res.ok) return []
  return res.json()
}

async function fetchWorkers(): Promise<Profile[]> {
  const res = await fetch("/api/admin/workers")
  if (!res.ok) return []
  return res.json()
}

function AssignDialog({
  request,
  workers,
}: {
  request: ServiceRequest
  workers: Profile[]
}) {
  const { t } = useTranslation()
  const [selectedWorker, setSelectedWorker] = useState(request.assigned_worker_id || "")
  const [selectedPriority, setSelectedPriority] = useState<RequestPriority>(request.priority)
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(request.status)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleAssign = async () => {
    setIsAssigning(true)
    try {
      const newStatus = selectedWorker && selectedStatus === "submitted" ? "assigned" : selectedStatus
      const res = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          assigned_worker_id: selectedWorker || null,
          priority: selectedPriority,
          status: newStatus,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      toast.success(t("admin.requests.save"))
      setOpen(false)
      mutate("admin-requests")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t("admin.requests.delete_confirm"))) return
    setIsDeleting(true)
    try {
      const res = await fetch("/api/admin/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed")
      }
      toast.success(t("admin.requests.delete"))
      setOpen(false)
      mutate("admin-requests")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-1 h-3.5 w-3.5" />
          {t("admin.requests.manage")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.requests.dispatch")}: {request.title}</DialogTitle>
          <DialogDescription>{t("admin.requests.dispatch_desc")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid gap-2">
            <Label>{t("admin.requests.assign")}</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger>
                <SelectValue placeholder={t("admin.requests.select_worker")} />
              </SelectTrigger>
              <SelectContent>
                {workers.length === 0 ? (
                  <SelectItem value="none" disabled>{t("admin.requests.no_workers")}</SelectItem>
                ) : (
                  workers.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.full_name || w.id.slice(0, 8)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t("new.field.priority")}</Label>
              <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as RequestPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                  <SelectItem value="urgent">{t("priority.urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("worker.status")}</Label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as RequestStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">{t("status.submitted")}</SelectItem>
                  <SelectItem value="assigned">{t("status.assigned")}</SelectItem>
                  <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
                  <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAssign} disabled={isAssigning || isDeleting}>
              {isAssigning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("admin.requests.saving")}</>
              ) : (
                t("admin.requests.save")
              )}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isAssigning || isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.requests.delete")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminRequestsPage() {
  const { t } = useTranslation()
  const { data: requests = [], isLoading } = useSWR("admin-requests", fetchAllRequests)
  const { data: workers = [] } = useSWR("admin-workers", fetchWorkers)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.address?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
        <h1 className="text-2xl font-bold tracking-tight">{t("admin.requests.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.requests.subtitle")}</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("admin.requests.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t("status.all")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("status.all")}</SelectItem>
            <SelectItem value="submitted">{t("status.submitted")}</SelectItem>
            <SelectItem value="assigned">{t("status.assigned")}</SelectItem>
            <SelectItem value="in_progress">{t("status.in_progress")}</SelectItem>
            <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
            <SelectItem value="closed">{t("status.closed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{r.title}</p>
                  <StatusBadge status={r.status} />
                  <PriorityBadge priority={r.priority} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {r.category && (
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{r.category.name}</span>
                  )}
                  {r.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="max-w-[180px] truncate">{r.address}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                  {r.worker && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {t("admin.requests.worker_label")}: {r.worker.full_name || t("status.assigned")}
                    </span>
                  )}
                  {r.ai_verification && (
                    <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${r.ai_verification.resolved ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                      <BrainCircuit className="h-3 w-3" />
                      {t("common.work")}: {r.ai_verification.resolved ? t("admin.requests.work_verified") : t("admin.requests.work_not_done")}
                      <Star className="ml-0.5 h-3 w-3" />
                      {r.ai_verification.score != null ? `${r.ai_verification.score}/10` : "NA"}
                    </span>
                  )}

                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.photo_url && (
                  <a href={r.photo_url} target="_blank" rel="noopener noreferrer">
                    <img src={r.photo_url} alt="Report photo" className="h-12 w-12 rounded-md border object-cover" />
                  </a>
                )}
                <AssignDialog request={r} workers={workers} />
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <p className="font-medium text-muted-foreground">{t("admin.requests.none")}</p>
          </div>
        )}
      </div>
    </div>
  )
}
