import Link from "next/link"

export function Header() {
  return (
    <header className="w-full border-border border-b bg-bg">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-10">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold font-mono text-brand text-xl">&gt;</span>
          <span className="font-medium font-mono text-lg text-text-primary">coderoast</span>
        </Link>

        {/* nav */}
        <nav className="flex items-center gap-6">
          <Link
            href="/leaderboard"
            className="font-mono text-[13px] text-text-secondary transition-colors hover:text-text-primary"
          >
            leaderboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
