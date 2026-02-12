"use client"

import { createClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { useTranslation } from "@/lib/i18n"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, ClipboardList, MapPin, BarChart3, Users } from "lucide-react"
import type { Profile } from "@/lib/types"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const navItems = [
    { label: t("nav.overview"), href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: t("nav.all_requests"), href: "/admin/requests", icon: <ClipboardList className="h-4 w-4" /> },
    { label: t("nav.city_map"), href: "/admin/map", icon: <MapPin className="h-4 w-4" /> },
    { label: t("nav.users"), href: "/admin/users", icon: <Users className="h-4 w-4" /> },
    { label: t("nav.analytics"), href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ]

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (data) setProfile(data)
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
    <DashboardShell
      role="admin"
      userName={profile?.full_name || "Admin"}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  )
}
