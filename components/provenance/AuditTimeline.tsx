"use client";

import { motion } from "framer-motion";
import { ProvenanceBadge } from "@/components/dashboard/ProvenanceBadge";

export interface AuditItem {
  id: string;
  title: string;
  at: string;
  hashPreview: string;
  status: "verified" | "pending" | "failed";
  txHash?: string | null;
}

export function AuditTimeline({ items }: { items: AuditItem[] }) {
  return (
    <div className="relative border-l border-border/80 pl-6">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="mb-8 last:mb-0"
        >
          <span className="absolute -left-[9px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{item.title}</h3>
            <ProvenanceBadge status={item.status} txHash={item.txHash ?? undefined} />
          </div>
          <p className="text-xs text-muted-foreground">{item.at}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {item.hashPreview}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
