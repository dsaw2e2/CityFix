"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Category, RequestPriority, AIValidation } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import {
  ArrowLeft,
  Camera,
  MapPin,
  Loader2,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch("/api/categories")
    if (!res.ok) throw new Error("Failed")
    return await res.json()
  } catch {
    // Fallback: try direct Supabase client
    const supabase = createClient()
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name")
    return (data ?? []) as Category[]
  }
}

export default function NewRequestPage() {
  const { t } = useTranslation()
  const { data: categories = [] } = useSWR("categories", fetchCategories)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [priority, setPriority] = useState<RequestPriority>("medium")
  const [address, setAddress] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validation, setValidation] = useState<AIValidation | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const selectedCategory = categories.find((c) => c.id === categoryId)

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
        setGeoLoading(false)
      },
      () => { setGeoLoading(false) }
    )
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
      setValidation(null)
      setUploadedPhotoUrl(null)
    }
  }

  const resetValidation = () => setValidation(null)

  const handleValidate = async () => {
    if (!title.trim() || !description.trim() || !categoryId) return
    setValidating(true)
    setValidation(null)

    try {
      const supabase = createClient()
      let photoUrl = uploadedPhotoUrl

      if (photoFile && !photoUrl) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const ext = photoFile.name.split(".").pop() || "jpg"
          const filePath = `${user.id}/${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from("request-photos")
            .upload(filePath, photoFile, { cacheControl: "3600", upsert: false })
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("request-photos")
              .getPublicUrl(filePath)
            photoUrl = publicUrl
            setUploadedPhotoUrl(publicUrl)
          }
        }
      }

      const res = await fetch("/api/validate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description,
          category: selectedCategory?.name || "Other",
          photo_url: photoUrl,
        }),
      })

      const result: AIValidation = await res.json()
      setValidation(result)
      if (result.valid) setPriority(result.suggested_priority)
    } catch {
      setValidation({
        valid: true, score: null,
        reason: "Validation service unavailable - report accepted for manual review",
        suggested_priority: priority,
      })
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async () => {
    if (!validation?.valid) return
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) { router.push("/auth/login"); return }

      const { error } = await supabase.from("service_requests").insert({
        title: title.trim(), description: description.trim() || null,
        category_id: categoryId, priority: validation.suggested_priority || priority,
        citizen_id: user.id, address: address.trim() || null,
        latitude, longitude, photo_url: uploadedPhotoUrl, ai_validation: validation,
      })
      if (error) throw error
      router.push("/citizen")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/citizen" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("new.back")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("new.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("new.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-2">
            <Label htmlFor="title">{t("new.field.title")}</Label>
            <Input id="title" placeholder={t("new.field.title.placeholder")} required value={title} onChange={(e) => { setTitle(e.target.value); resetValidation() }} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{t("new.field.description")}</Label>
            <Textarea id="description" placeholder={t("new.field.description.placeholder")} rows={4} value={description} onChange={(e) => { setDescription(e.target.value); resetValidation() }} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("new.field.category")}</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); resetValidation() }}>
                <SelectTrigger disabled={categories.length === 0}>
                  <SelectValue placeholder={categories.length === 0 ? "..." : t("new.field.category.placeholder")} />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[200]">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t("new.field.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as RequestPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                  <SelectItem value="urgent">{t("priority.urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("new.field.location")}</Label>
            <div className="flex gap-2">
              <Input placeholder={t("new.field.location.placeholder")} value={address} onChange={(e) => setAddress(e.target.value)} className="flex-1" />
              <Button type="button" variant="outline" onClick={detectLocation} disabled={geoLoading}>
                {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("new.field.photo")}</Label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" />
                {photoFile ? t("new.photo.change") : t("new.photo.attach")}
              </Button>
              {photoFile && <span className="text-sm text-muted-foreground">{photoFile.name}</span>}
            </div>
            {photoPreview && <img src={photoPreview} alt="Preview" className="mt-2 h-40 w-full rounded-lg border object-cover" />}
          </div>

          {validation && (
            <Card className={`border-2 ${validation.valid ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {validation.valid ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {validation.valid ? t("new.ai.approved") : t("new.ai.rejected")}
                      <span className="ml-2 font-normal text-muted-foreground">
                        ({t("new.ai.severity")}: {validation.score != null ? `${validation.score}/10` : "NA"})
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{validation.reason}</p>
                    {validation.valid && (
                      <p className="text-xs text-muted-foreground">
                        {t("new.ai.priority_set")}: <span className="font-medium capitalize text-foreground">{t(`priority.${validation.suggested_priority}`)}</span>
                      </p>
                    )}
                    {!validation.valid && <p className="mt-1 text-xs text-destructive">{t("new.ai.edit_hint")}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {!validation?.valid && (
              <Button onClick={handleValidate} disabled={validating || !title.trim() || !description.trim() || !categoryId} className="w-full">
                {validating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("new.btn.validating")}</>
                ) : validation && !validation.valid ? (
                  <><AlertTriangle className="mr-2 h-4 w-4" />{t("new.btn.revalidate")}</>
                ) : (
                  <><BrainCircuit className="mr-2 h-4 w-4" />{t("new.btn.validate")}</>
                )}
              </Button>
            )}
            {validation?.valid && (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("new.btn.submitting")}</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />{t("new.btn.submit")}</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
