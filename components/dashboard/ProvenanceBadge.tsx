"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SCAN = "https://amoy.polygonscan.com/tx/";

export function ProvenanceBadge({
  status,
  txHash,
  className,
}: {
  status: "verified" | "pending" | "failed";
  txHash?: string;
  className?: string;
}) {
  const Icon =
    status === "verified"
      ? ShieldCheck
      : status === "pending"
        ? Clock
        : XCircle;
  const label =
    status === "verified"
      ? "Verified On-Chain"
      : status === "pending"
        ? "Pending"
        : "Failed";

  const content = (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "verified" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        status === "pending" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-400",
        status === "failed" && "border-red-500/40 bg-red-500/10 text-red-400",
        className
      )}
      animate={status === "pending" ? { opacity: [1, 0.6, 1] } : undefined}
      transition={
        status === "pending" ? { repeat: Infinity, duration: 2 } : undefined
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </motion.span>
  );

  if (txHash) {
    return (
      <a
        href={`${SCAN}${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="inline-block"
      >
        {content}
      </a>
    );
  }

  return content;
}
