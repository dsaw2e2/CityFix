"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Shield, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      // Read role directly from user metadata (no RLS query needed)
      const user = signInData.user
      if (user) {
        const role = (user.user_metadata?.role as string) || "citizen"
        window.location.href = `/${role}`
        return
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      if (msg.includes("Invalid login credentials")) {
        setError(t("auth.error.wrong_creds"))
      } else if (msg.includes("Email not confirmed")) {
        setError(t("auth.error.not_confirmed"))
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight text-foreground">
              CityFix
            </span>
          </div>
          <LanguageSwitcher />
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t("auth.welcome")}</CardTitle>
              <CardDescription>{t("auth.signin.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="citizen@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.signing_in")}
                      </>
                    ) : (
                      t("auth.signin")
                    )}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {t("auth.no_account")}{" "}
                  <Link
                    href="/auth/sign-up"
                    className="text-primary underline underline-offset-4"
                  >
                    {t("auth.create_account")}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
