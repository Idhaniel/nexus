import crypto from "crypto";

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function hashParameters(params: object): string {
  return sha256(JSON.stringify(params, Object.keys(params).sort()));
}

export function hashResults(results: object): string {
  return sha256(JSON.stringify(results, Object.keys(results).sort()));
}

export function computeCombinedHash(hashes: {
  inputHash: string;
  outputHash: string;
  parametersHash: string;
  modelVersionHash: string;
}): string {
  const combined = [
    hashes.inputHash,
    hashes.outputHash,
    hashes.parametersHash,
    hashes.modelVersionHash,
  ].join("|");
  return sha256(combined);
}
