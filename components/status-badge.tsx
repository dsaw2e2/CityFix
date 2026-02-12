"use client"

import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { STATUS_CONFIG, type RequestStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
