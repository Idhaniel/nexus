import { NextResponse } from "next/server";
import { verifyOnChain } from "@/lib/blockchain/contract";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const recordId = Number(body.recordId);
    const combinedHash = body.combinedHash as string;

    if (!recordId || Number.isNaN(recordId) || !combinedHash?.trim()) {
      return NextResponse.json(
        { error: "recordId and combinedHash required" },
        { status: 400 }
      );
    }

    try {
      const valid = await verifyOnChain(recordId, combinedHash.trim());
      return NextResponse.json({ valid, recordId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      return NextResponse.json({ valid: false, error: msg }, { status: 200 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
