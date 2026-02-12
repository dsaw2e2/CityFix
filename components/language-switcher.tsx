"use client"

import { useTranslation, type Locale } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const LANGS: { code: Locale; label: string }[] = [
  { code: "kk", label: "ҚАЗ" },
  { code: "ru", label: "РУС" },
  { code: "en", label: "ENG" },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation()

  return (
    <div className={cn("flex items-center gap-0.5 text-xs font-medium", className)}>
      {LANGS.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          {i > 0 && <span className="mx-1 text-muted-foreground/50">|</span>}
          <button
            onClick={() => setLocale(lang.code)}
            className={cn(
              "rounded px-1 py-0.5 transition-colors",
              locale === lang.code
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  )
}
