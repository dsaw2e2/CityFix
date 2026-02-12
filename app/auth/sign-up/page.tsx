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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslation } from "@/lib/i18n"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Shield, KeyRound, Loader2, Eye, EyeOff } from "lucide-react"
import type { UserRole } from "@/lib/types"

const ROLE_CODES: Record<string, string> = {
  worker: "WorkerCode123",
  admin: "AdminCode123",
}

export default function SignUpPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<UserRole>("citizen")
  const [accessCode, setAccessCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const needsCode = role === "worker" || role === "admin"

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t("auth.error.passwords_mismatch"))
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t("auth.error.password_short"))
      setIsLoading(false)
      return
    }

    if (needsCode) {
      if (!accessCode) {
        setError(t("auth.error.code_required"))
        setIsLoading(false)
        return
      }
      if (accessCode !== ROLE_CODES[role]) {
        setError(t("auth.error.code_invalid"))
        setIsLoading(false)
        return
      }
    }

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        if (data.session) {
          const dest = `/${role}`
          window.location.href = dest
          return
        }

        if (data.user.identities && data.user.identities.length > 0) {
          router.push("/auth/sign-up-success")
          return
        }

        setError(t("auth.error.exists"))
        return
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      if (msg.includes("User already registered")) {
        setError(t("auth.error.exists"))
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
              <CardTitle className="text-xl">{t("auth.create_title")}</CardTitle>
              <CardDescription>{t("auth.create_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">{t("auth.fullname")}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
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
                    <Label htmlFor="role">{t("auth.role")}</Label>
                    <Select
                      value={role}
                      onValueChange={(v) => {
                        setRole(v as UserRole)
                        setAccessCode("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="citizen">{t("auth.role.citizen")}</SelectItem>
                        <SelectItem value="worker">{t("auth.role.worker")}</SelectItem>
                        <SelectItem value="admin">{t("auth.role.admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {needsCode && (
                    <div className="grid gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                      <Label htmlFor="accessCode" className="flex items-center gap-1.5 text-primary">
                        <KeyRound className="h-3.5 w-3.5" />
                        {role === "worker" ? t("role.worker") : t("role.admin")} {t("auth.access_code")}
                      </Label>
                      <Input
                        id="accessCode"
                        type="password"
                        placeholder={t("auth.access_code.placeholder")}
                        required
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("auth.access_code.help")}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.password.min6")}
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
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{t("auth.confirm_password")}</Label>
                    <Input
                      id="repeat-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("auth.creating")}
                      </>
                    ) : (
                      t("auth.create_account")
                    )}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {t("auth.has_account")}{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary underline underline-offset-4"
                  >
                    {t("auth.signin")}
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
