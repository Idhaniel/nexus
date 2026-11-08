import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { recordOnChain } from "@/lib/blockchain/contract";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      scenarioId,
      resultId,
      inputHash,
      outputHash,
      parametersHash,
      modelVersionHash,
      combinedHash,
    } = body as Record<string, string | undefined>;

    if (
      !scenarioId ||
      !resultId ||
      !inputHash ||
      !outputHash ||
      !parametersHash ||
      !modelVersionHash ||
      !combinedHash
    ) {
      return NextResponse.json(
        { error: "Missing required hash fields or ids" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    let txHash: string | null = null;
    let blockNumber: number | null = null;
    let onChainRecordId: bigint = BigInt(0);
    let verificationStatus: "confirmed" | "pending" | "failed" = "pending";

    try {
      const chain = await recordOnChain({
        scenarioId,
        inputHash,
        outputHash,
        parametersHash,
        modelVersionHash,
        combinedHash,
      });
      txHash = chain.txHash;
      blockNumber = chain.blockNumber;
      onChainRecordId = chain.recordId;
      verificationStatus = "confirmed";
    } catch (err) {
      console.error("Blockchain record failed:", err);
      verificationStatus = "pending";
    }

    const { data: prov, error } = await supabase
      .from("provenance_records")
      .insert({
        scenario_id: scenarioId,
        result_id: resultId,
        input_hash: inputHash,
        output_hash: outputHash,
        parameters_hash: parametersHash,
        model_version_hash: modelVersionHash,
        combined_hash: combinedHash,
        transaction_hash: txHash,
        block_number: blockNumber,
        contract_address: contractAddress ?? null,
        network_name: "polygon-amoy",
        on_chain_record_id: onChainRecordId ? Number(onChainRecordId) : null,
        verification_status: verificationStatus,
        block_timestamp:
          verificationStatus === "confirmed"
            ? new Date().toISOString()
            : null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: error.message || "Failed to save provenance" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      txHash,
      blockNumber,
      recordId: onChainRecordId ? Number(onChainRecordId) : 0,
      status: verificationStatus,
      provenanceId: prov?.id,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Recording failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
