import {
  getCitizenLevel,
  getNextLevel,
  getProgressToNextLevel,
} from "@/lib/gamification"
import { Progress } from "@/components/ui/progress"
import { Award, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface CitizenLevelCardProps {
  reportCount: number
}

export function CitizenLevelCard({ reportCount }: CitizenLevelCardProps) {
  const currentLevel = getCitizenLevel(reportCount)
  const nextLevel = getNextLevel(reportCount)
  const progress = getProgressToNextLevel(reportCount)

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              currentLevel.bgClass
            )}
          >
            <Award className={cn("h-5 w-5", currentLevel.colorClass)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn("text-sm font-semibold", currentLevel.colorClass)}>
                {currentLevel.title}
              </h3>
              <span className="text-xs text-muted-foreground">
                Level {currentLevel.level}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentLevel.description}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {reportCount}
          </span>
          <span className="text-xs text-muted-foreground">
            {reportCount === 1 ? "report" : "reports"}
          </span>
        </div>
      </div>

      {nextLevel ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Next: <span className={cn("font-medium", nextLevel.colorClass)}>{nextLevel.title}</span>
            </span>
            <span className="text-muted-foreground">
              {reportCount}/{nextLevel.minReports} reports
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName={currentLevel.progressColor}
          />
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <Award className="h-3.5 w-3.5" />
          Highest level reached. Thank you for your outstanding civic engagement.
        </div>
      )}
    </div>
  )
}
