"use client"

import { createClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, MapPin, CheckCircle2, Trophy } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import type { Profile } from "@/lib/types"

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const navItems = [
    { label: t("nav.my_tasks"), href: "/worker", icon: <ClipboardList className="h-4 w-4" /> },
    { label: t("nav.completed"), href: "/worker/history", icon: <CheckCircle2 className="h-4 w-4" /> },
    { label: t("nav.field_map"), href: "/worker/map", icon: <MapPin className="h-4 w-4" /> },
    { label: t("nav.rankings"), href: "/worker/rankings", icon: <Trophy className="h-4 w-4" /> },
  ]

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      // Read from user metadata to avoid RLS issues
      setProfile({
        id: user.id,
        full_name: (user.user_metadata?.full_name as string) || t("role.worker"),
        role: (user.user_metadata?.role as string) || "worker",
      } as Profile)
      setLoading(false)
    }
    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <DashboardShell role="worker" userName={profile?.full_name || t("role.worker")} navItems={navItems}>
      {children}
    </DashboardShell>
  )
}
