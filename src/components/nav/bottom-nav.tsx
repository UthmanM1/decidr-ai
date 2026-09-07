"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bookmark, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/recommendations", label: "Saved", icon: Bookmark },
  { href: "/lists", label: "Lists", icon: ListChecks },
  { href: "/profile", label: "Profile", icon: User }
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
              active ? "text-moss" : "text-slate"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
