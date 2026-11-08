"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FEWModelResult } from "@/lib/model/fewEngine";

export function ScenarioResultDisplay({ result }: { result: FEWModelResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 md:grid-cols-3"
    >
      <Card className="border-few-water/30 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-few-water">Water index</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-3xl font-bold">{result.waterUseIndex}</p>
          <p className="text-xs text-muted-foreground">
            {result.waterUseLower.toFixed(1)} – {result.waterUseUpper.toFixed(1)} band
          </p>
          <p className="mt-1 text-sm">
            ≈ {result.waterUseAbsolute} Bm³/yr (model estimate)
          </p>
        </CardContent>
      </Card>
      <Card className="border-few-energy/30 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-few-energy">Energy index</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-3xl font-bold">{result.energyUseIndex}</p>
          <p className="text-xs text-muted-foreground">
            {result.energyUseLower.toFixed(1)} – {result.energyUseUpper.toFixed(1)} band
          </p>
          <p className="mt-1 text-sm">
            ≈ {result.energyUseAbsolute} TWh/yr
          </p>
        </CardContent>
      </Card>
      <Card className="border-few-food/30 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-few-food">Food output index</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-3xl font-bold">{result.foodOutputIndex}</p>
          <p className="text-xs text-muted-foreground">
            {result.foodOutputLower.toFixed(1)} – {result.foodOutputUpper.toFixed(1)} band
          </p>
          <p className="mt-1 text-sm">
            ≈ {result.foodOutputAbsolute} Mt/yr
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
