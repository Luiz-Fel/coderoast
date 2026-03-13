import type { Metadata } from "next"
import { Header } from "@/components/ui/header"
import "./globals.css"

export const metadata: Metadata = {
  title: "devroast",
  description: "paste your code. get roasted.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-bg text-text-primary">
        <Header />
        {children}
      </body>
    </html>
  )
}
