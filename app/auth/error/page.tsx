"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>{t("auth.error.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("auth.error.desc")}
            </p>
            <Link
              href="/auth/login"
              className="mt-4 inline-block text-sm text-primary underline underline-offset-4"
            >
              {t("auth.error.back")}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
