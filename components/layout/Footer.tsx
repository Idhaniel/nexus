import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/20 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>
          NexusLens — University of Lagos · Computer Engineering research
        </p>
        <div className="flex gap-4">
          <Link href="/education" className="hover:text-foreground">
            FEW explainer
          </Link>
          <Link href="/provenance" className="hover:text-foreground">
            Provenance
          </Link>
        </div>
      </div>
    </footer>
  );
}
