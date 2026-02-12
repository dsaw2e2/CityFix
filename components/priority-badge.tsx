"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { PRIORITY_CONFIG, type RequestPriority } from "@/lib/types"

interface PriorityBadgeProps {
  priority: RequestPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { t } = useTranslation()
  const config = PRIORITY_CONFIG[priority]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        className
      )}
    >
      {t(`priority.${priority}`)}
    </span>
  )
}
