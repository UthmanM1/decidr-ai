import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/recommendations", label: "Saved" },
  { href: "/lists", label: "Lists" }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-paper/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-lg tracking-tight text-ink">
          Decidr <span className="text-moss">AI</span>
        </Link>
        <nav className="flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-slate hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate hover:text-ink">
            Log in
          </Link>
          <Link href="/discover">
            <Button size="sm">Start a decision</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
