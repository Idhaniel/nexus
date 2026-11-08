"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScenarioCardProps {
  title: string;
  type: string;
  water: number;
  energy: number;
  food: number;
  trend?: "up" | "down" | "flat";
}

export function ScenarioCard({
  title,
  type,
  water,
  energy,
  food,
  trend = "flat",
}: ScenarioCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/80 bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="secondary">{type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-few-water">Water</p>
            <p className="font-mono text-lg">{water}</p>
          </div>
          <div>
            <p className="text-few-energy">Energy</p>
            <p className="font-mono text-lg">{energy}</p>
          </div>
          <div>
            <p className="text-few-food">Food</p>
            <p className="font-mono text-lg">{food}</p>
          </div>
          <p className="col-span-3 text-xs text-muted-foreground">
            Trend: {trend}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
