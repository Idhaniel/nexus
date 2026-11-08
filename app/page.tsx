"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

function useCount(target: number, duration = 1.2) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf: number;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      setV(Math.round(target * (0.5 - 0.5 * Math.cos(Math.PI * p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export default function HomePage() {
  const pop = useCount(230);
  const basket = useCount(40);

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 px-6 py-16 sm:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400/90">
            NexusLens
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Transparent FEW Nexus Decision Support with Blockchain Provenance
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Configure Food–Energy–Water scenarios, explore trade-offs with
            interactive dashboards, and anchor every run with cryptographic
            hashes on an Ethereum-compatible ledger for auditability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Launch dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/scenarios">Explore scenarios</Link>
            </Button>
          </div>
        </motion.div>
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl border border-border/60 bg-card/40 p-6"
        >
          <p className="font-mono text-4xl font-bold text-few-water">{pop}M</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nigeria population scale (illustrative driver in the model)
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border/60 bg-card/40 p-6"
        >
          <p className="font-mono text-4xl font-bold text-few-energy">
            {basket}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Stylized food basket pressure index (animated demo)
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border/60 bg-card/40 p-6"
        >
          <p className="font-mono text-4xl font-bold text-few-food">10 yr</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Default planning horizon for longitudinal FEW trajectories
          </p>
        </motion.div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Why NexusLens</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Interactive modeling",
              body: "Tune irrigation, energy mix, subsidies, and technology adoption — see indices and Nigeria-scaled absolutes.",
            },
            {
              title: "Blockchain provenance",
              body: "SHA-256 fingerprints of inputs and outputs, combined and anchored on Polygon Mumbai via a minimal Solidity ledger.",
            },
            {
              title: "Scenario comparison",
              body: "Baseline, efficiency, production expansion, and renewable transition presets side-by-side.",
            },
            {
              title: "Reproducible science",
              body: "Hashes and on-chain record IDs support third-party verification of scenario outputs.",
            },
          ].map((c) => (
            <Card key={c.title} className="border-border/80 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">{c.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {c.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
