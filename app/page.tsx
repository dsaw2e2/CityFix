"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n"
import {
  Shield,
  FileText,
  MapPin,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const { t } = useTranslation()

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: t("landing.feature1.title"),
      description: t("landing.feature1.desc"),
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: t("landing.feature2.title"),
      description: t("landing.feature2.desc"),
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: t("landing.feature3.title"),
      description: t("landing.feature3.desc"),
    },
  ]

  const stats = [
    { icon: <CheckCircle2 className="h-5 w-5" />, value: "2,847", label: t("landing.stat.resolved") },
    { icon: <Clock className="h-5 w-5" />, value: "< 48h", label: t("landing.stat.response") },
    { icon: <Users className="h-5 w-5" />, value: "12,500+", label: t("landing.stat.citizens") },
  ]

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">CityFix</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">{t("auth.signin")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">{t("auth.signup")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center md:py-28">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" />
            {t("landing.badge")}
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {t("landing.hero.title")}{" "}
            <span className="text-primary">{t("landing.hero.highlight")}</span>
          </h1>
          <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                {t("landing.cta.report")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">{t("landing.cta.signin")}</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-card px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold tracking-tight">
            {t("landing.features.title")}
          </h2>
          <p className="mb-10 text-center text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-1 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  )
}
