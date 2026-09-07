"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Package,
  Store,
  BarChart3,
  Cpu,
  Activity
} from "lucide-react";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/ai-usage", label: "AI usage", icon: Cpu },
  { href: "/admin/events", label: "Events", icon: Activity }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-white px-3 py-6">
      <Link href="/" className="mb-8 block px-3 font-display text-lg text-ink">
        Decidr <span className="text-moss">Admin</span>
      </Link>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                active ? "bg-sand text-ink" : "text-slate hover:bg-sand/60 hover:text-ink"
              )}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
