import { getCitizenLevel } from "@/lib/gamification"
import { Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface CitizenLevelBadgeProps {
  reportCount: number
  className?: string
}

export function CitizenLevelBadge({ reportCount, className }: CitizenLevelBadgeProps) {
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
      {level.title}
    </span>
  )
}
