import { ethers } from "ethers";

/**
 * Human-readable ABI — no Hardhat artifacts required at build time (e.g. Vercel).
 * Keep in sync with contracts/ProvenanceLedger.sol
 */
const PROVENANCE_LEDGER_ABI = [
  "constructor()",
  "function recordProvenance(string,string,string,string,string,string) external returns (uint256)",
  "function validateHash(uint256,string) external view returns (bool)",
  "function getRecord(uint256) external view returns (tuple(uint256,string,string,string,string,string,string,address,uint256,bool))",
  "event RecordCreated(uint256 indexed recordId, string scenarioId, string combinedHash, address indexed recorder, uint256 timestamp)",
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL =
  process.env.POLYGON_AMOY_RPC_URL || process.env.POLYGON_MUMBAI_RPC_URL;
const PRIVATE_KEY = process.env.RECORDER_PRIVATE_KEY;

function getProvider(): ethers.JsonRpcProvider {
  if (!RPC_URL) throw new Error("POLYGON_AMOY_RPC_URL is not set");
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getSigner(): ethers.Wallet {
  if (!PRIVATE_KEY) throw new Error("RECORDER_PRIVATE_KEY is not set");
  return new ethers.Wallet(PRIVATE_KEY, getProvider());
}

export function getContract(withSigner = false): ethers.Contract {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS is not set");
  const runner = withSigner ? getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESS,
    PROVENANCE_LEDGER_ABI,
    runner
  );
}

export async function recordOnChain(data: {
  scenarioId: string;
  inputHash: string;
  outputHash: string;
  parametersHash: string;
  modelVersionHash: string;
  combinedHash: string;
}): Promise<{ txHash: string; blockNumber: number; recordId: bigint }> {
  const contract = getContract(true);
  const tx = await contract.recordProvenance(
    data.scenarioId,
    data.inputHash,
    data.outputHash,
    data.parametersHash,
    data.modelVersionHash,
    data.combinedHash
  );
  const receipt = await tx.wait();

  const event = receipt?.logs
    .map((log: ethers.Log) => {
      try {
        return contract.interface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
      } catch {
        return null;
      }
    })
    .find((e: ethers.LogDescription | null) => e?.name === "RecordCreated");

  return {
    txHash: receipt!.hash,
    blockNumber: receipt!.blockNumber,
    recordId: (event?.args?.[0] as bigint) ?? BigInt(0),
  };
}

export async function verifyOnChain(
  recordId: number,
  hashToVerify: string
): Promise<boolean> {
  const contract = getContract(false);
  return contract.validateHash(recordId, hashToVerify) as Promise<boolean>;
}

export async function getOnChainRecord(recordId: number) {
  const contract = getContract(false);
  return contract.getRecord(recordId);
}
