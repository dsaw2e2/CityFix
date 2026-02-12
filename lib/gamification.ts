export interface CitizenLevel {
  level: number
  title: string
  minReports: number
  description: string
  colorClass: string
  bgClass: string
  progressColor: string
}

export const CITIZEN_LEVELS: CitizenLevel[] = [
  {
    level: 1,
    title: "New Resident",
    minReports: 0,
    description: "Welcome to CityFix. Submit reports to help improve your community.",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted",
    progressColor: "bg-muted-foreground",
  },
  {
    level: 2,
    title: "Community Member",
    minReports: 3,
    description: "You are making a difference. Your reports help keep the city running smoothly.",
    colorClass: "text-primary",
    bgClass: "bg-primary/10",
    progressColor: "bg-primary",
  },
  {
    level: 3,
    title: "Active Contributor",
    minReports: 10,
    description: "Your consistent engagement helps prioritize issues across the city.",
    colorClass: "text-success",
    bgClass: "bg-success/10",
    progressColor: "bg-success",
  },
  {
    level: 4,
    title: "Neighborhood Champion",
    minReports: 25,
    description: "A recognized advocate for community improvement. Thank you for your dedication.",
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
    progressColor: "bg-warning",
  },
  {
    level: 5,
    title: "Civic Leader",
    minReports: 50,
    description: "Among the most active citizens on CityFix. Your contributions shape the city.",
    colorClass: "text-[hsl(var(--chart-5))]",
    bgClass: "bg-[hsl(var(--chart-5))]/10",
    progressColor: "bg-[hsl(var(--chart-5))]",
  },
]

export function getCitizenLevel(reportCount: number): CitizenLevel {
  let current = CITIZEN_LEVELS[0]
  for (const level of CITIZEN_LEVELS) {
    if (reportCount >= level.minReports) {
      current = level
    } else {
      break
    }
  }
  return current
}

export function getNextLevel(reportCount: number): CitizenLevel | null {
  const current = getCitizenLevel(reportCount)
  const nextIndex = CITIZEN_LEVELS.findIndex((l) => l.level === current.level) + 1
  return nextIndex < CITIZEN_LEVELS.length ? CITIZEN_LEVELS[nextIndex] : null
}

export function getProgressToNextLevel(reportCount: number): number {
  const current = getCitizenLevel(reportCount)
  const next = getNextLevel(reportCount)
  if (!next) return 100
  const range = next.minReports - current.minReports
  const progress = reportCount - current.minReports
  return Math.min(100, Math.round((progress / range) * 100))
}
