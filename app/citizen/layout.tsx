"use client"

import { createClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, PlusCircle, MapPin } from "lucide-react"
import { CitizenLevelBadge } from "@/components/citizen-level-badge"
import type { Profile } from "@/lib/types"

const navItems = [
  { label: "My Requests", href: "/citizen", icon: <FileText className="h-4 w-4" /> },
  { label: "New Request", href: "/citizen/new", icon: <PlusCircle className="h-4 w-4" /> },
  { label: "Map", href: "/citizen/map", icon: <MapPin className="h-4 w-4" /> },
]

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reportCount, setReportCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

      const { count } = await supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("citizen_id", user.id)
      setReportCount(count ?? 0)
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
      role="citizen"
      userName={profile?.full_name || "Citizen"}
      navItems={navItems}
      levelBadge={<CitizenLevelBadge reportCount={reportCount} />}
    >
      {children}
    </DashboardShell>
  )
}
