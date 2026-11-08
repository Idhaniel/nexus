"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/provenance", label: "Provenance" },
  { href: "/education", label: "Education" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <motion.span
            className="text-xl font-bold tracking-tight text-primary"
            whileHover={{ scale: 1.02 }}
          >
            NexusLens
          </motion.span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            FEW · Blockchain provenance
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              <span
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === l.href
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/scenarios/new">New scenario</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
