"use client"

import { getCitizenLevel } from "@/lib/gamification"
import { useTranslation } from "@/lib/i18n"
import { Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface CitizenLevelBadgeProps {
  reportCount: number
  className?: string
}

export function CitizenLevelBadge({ reportCount, className }: CitizenLevelBadgeProps) {
  const { t } = useTranslation()
  const level = getCitizenLevel(reportCount)

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        level.bgClass,
        level.colorClass,
        className
      )}
    >
      <Award className="h-3 w-3" />
      {t(`level.${level.level}.title`)}
    </span>
  )
}
