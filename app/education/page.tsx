"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SCENARIOS = [
  {
    key: "baseline",
    title: "Baseline",
    body: "Reflects current allocation patterns — higher fossil share and moderate irrigation efficiency.",
  },
  {
    key: "efficiency",
    title: "Efficiency",
    body: "Water-saving technologies, recycling, and stronger adoption of precision approaches.",
  },
  {
    key: "production_expansion",
    title: "Production expansion",
    body: "Higher crop intensity and subsidies — pushes energy and water demand.",
  },
  {
    key: "renewable_transition",
    title: "Renewable transition",
    body: "Solar/wind/hydro substitution with hydro-related water trade-offs.",
  },
];

export default function EducationPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Food–Energy–Water nexus
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Agriculture, energy, and water are tightly coupled: pumping and processing consume
          electricity; energy generation withdraws or consumes water; food production depends on
          both. Nexus thinking makes these feedbacks explicit for policy design.
        </p>
      </div>

      <div className="relative mx-auto max-w-2xl">
        <svg viewBox="0 0 400 280" className="w-full text-primary">
          <motion.circle
            cx="200"
            cy="100"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
          />
          <text x="200" y="105" textAnchor="middle" className="fill-few-water text-sm font-semibold">
            Water
          </text>
          <motion.circle
            cx="120"
            cy="200"
            r="56"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.1 }}
          />
          <text x="120" y="205" textAnchor="middle" className="fill-few-energy text-sm font-semibold">
            Energy
          </text>
          <motion.circle
            cx="280"
            cy="200"
            r="56"
            fill="none"
            stroke="#22C55E"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
          />
          <text x="280" y="205" textAnchor="middle" className="fill-few-food text-sm font-semibold">
            Food
          </text>
        </svg>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {SCENARIOS.map((s) => (
          <Card key={s.key} className="border-border/80 bg-card/50">
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{s.body}</p>
              <Button asChild size="sm" variant="secondary">
                <Link href={`/scenarios/new`}>Try in builder</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle>Nigeria context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Rapid population growth, rainfed–irrigated gradients, and grid constraints make FEW
            trade-offs acute. NexusLens uses stylized indices calibrated to illustrative national
            magnitudes — suitable for teaching and exploratory policy dialogue rather than
            operational forecasting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
