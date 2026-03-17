import type { Metadata } from "next"
import { Header } from "@/components/ui/header"
import { TRPCReactProvider } from "@/trpc/client"
import "./globals.css"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "coderoast",
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
        <TRPCReactProvider>
          <Header />
          {children}
        </TRPCReactProvider>
      </body>
    </html>
  )
}
