import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { I18nProvider } from "@/lib/i18n"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "CityFix - Municipal Service Request Platform",
  description:
    "Report civic issues, track resolutions, and keep your city running smoothly.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a6dc2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <I18nProvider>
          {children}
          <Toaster position="top-right" richColors />
        </I18nProvider>
      </body>
    </html>
  )
}
