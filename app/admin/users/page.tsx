"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/lib/i18n"
import type { Profile, UserRole } from "@/lib/types"
import { Search, User, Wrench, Shield, Inbox, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import useSWR, { mutate } from "swr"

async function fetchAllUsers(): Promise<Profile[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
  return (data ?? []) as Profile[]
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  citizen: <User className="h-4 w-4" />,
  worker: <Wrench className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
}

const ROLE_COLORS: Record<UserRole, string> = {
  citizen: "bg-muted text-muted-foreground",
  worker: "bg-primary/10 text-primary",
  admin: "bg-destructive/10 text-destructive",
}

function UserCard({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRoleChange = async (newRole: UserRole) => {
    setIsUpdating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", profile.id)

      if (error) throw error
      toast.success(`${t("auth.role")}: ${t(`role.${newRole}`)}`)
      mutate("admin-users")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${ROLE_COLORS[profile.role]}`}>
            {ROLE_ICONS[profile.role]}
          </div>
          <div>
            <p className="font-semibold text-foreground">{profile.full_name || t("admin.users.unnamed")}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {profile.phone && <span>{profile.phone}</span>}
              <span>{t("admin.users.joined")} {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Select value={profile.role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="citizen">{t("role.citizen")}</SelectItem>
              <SelectItem value="worker">{t("role.worker")}</SelectItem>
              <SelectItem value="admin">{t("role.admin")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const { data: users = [], isLoading } = useSWR("admin-users", fetchAllUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.users.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} {t("admin.users.total")} &mdash; {roleCounts["citizen"] || 0} {t("admin.users.citizens")}, {roleCounts["worker"] || 0} {t("admin.users.workers")}, {roleCounts["admin"] || 0} {t("admin.users.admins")}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("admin.users.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t("admin.users.all_roles")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.users.all_roles")}</SelectItem>
            <SelectItem value="citizen">{t("admin.users.citizens")}</SelectItem>
            <SelectItem value="worker">{t("admin.users.workers")}</SelectItem>
            <SelectItem value="admin">{t("admin.users.admins")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">{t("admin.users.none")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((user) => (
            <UserCard key={user.id} profile={user} />
          ))}
        </div>
      )}
    </div>
  )
}
