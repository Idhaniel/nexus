import { expect } from "chai";
import { ethers } from "hardhat";
import { ProvenanceLedger } from "../../typechain-types";

describe("ProvenanceLedger", function () {
  let ledger: ProvenanceLedger;
  let owner: Awaited<ReturnType<typeof ethers.getSigners>>[0];
  let authorized: Awaited<ReturnType<typeof ethers.getSigners>>[1];
  let stranger: Awaited<ReturnType<typeof ethers.getSigners>>[2];

  const scenarioId = "550e8400-e29b-41d4-a716-446655440000";
  const hashes = {
    input: "a".repeat(64),
    output: "b".repeat(64),
    parameters: "c".repeat(64),
    modelVersion: "d".repeat(64),
  };

  async function combinedHashFrom(
    input: string,
    output: string,
    parameters: string,
    modelVersion: string
  ): Promise<string> {
    const combined = [input, output, parameters, modelVersion].join("|");
    return ethers.sha256(ethers.toUtf8Bytes(combined)).slice(2);
  }

  beforeEach(async function () {
    [owner, authorized, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProvenanceLedger");
    ledger = (await Factory.deploy()) as ProvenanceLedger;
    await ledger.waitForDeployment();
    await ledger.connect(owner).addAuthorizedRecorder(authorized.address);
  });

  it("owner can record provenance", async function () {
    const ch = await combinedHashFrom(
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion
    );
    const tx = await ledger.recordProvenance(
      scenarioId,
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion,
      ch
    );
    const receipt = await tx.wait();
    const iface = ledger.interface;
    const ev = receipt!.logs
      .map((log) => {
        try {
          return iface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
        } catch {
          return null;
        }
      })
      .find((p) => p?.name === "RecordCreated");
    expect(ev).to.not.be.undefined;
    expect(ev!.args[0]).to.equal(1n);
    expect(ev!.args[1]).to.equal(scenarioId);
    expect(ev!.args[2]).to.equal(ch);
    expect(ev!.args[3]).to.equal(owner.address);
  });

  it("non-authorized address cannot record", async function () {
    const ch = await combinedHashFrom(
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion
    );
    await expect(
      ledger.connect(stranger).recordProvenance(
        scenarioId,
        hashes.input,
        hashes.output,
        hashes.parameters,
        hashes.modelVersion,
        ch
      )
    ).to.be.revertedWith("Not authorized recorder");
  });

  it("validateHash returns true for correct hash, false for tampered", async function () {
    const ch = await combinedHashFrom(
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion
    );
    await ledger.recordProvenance(
      scenarioId,
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion,
      ch
    );
    expect(await ledger.validateHash(1, ch)).to.equal(true);
    const bad = "f".repeat(64);
    expect(await ledger.validateHash(1, bad)).to.equal(false);
  });

  it("getScenarioRecordIds returns correct IDs", async function () {
    const ch = await combinedHashFrom(
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion
    );
    await ledger.recordProvenance(
      scenarioId,
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion,
      ch
    );
    const ids = await ledger.getScenarioRecordIds(scenarioId);
    expect(ids.length).to.equal(1);
    expect(ids[0]).to.equal(1n);
  });

  it("record count increments correctly", async function () {
    expect(await ledger.recordCount()).to.equal(0n);
    const ch = await combinedHashFrom(
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion
    );
    await ledger.recordProvenance(
      scenarioId,
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion,
      ch
    );
    expect(await ledger.recordCount()).to.equal(1n);
    await ledger.recordProvenance(
      scenarioId,
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion,
      ch
    );
    expect(await ledger.recordCount()).to.equal(2n);
  });

  it("RecordCreated event is emitted with correct args", async function () {
    const ch = await combinedHashFrom(
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion
    );
    const tx = await ledger.connect(authorized).recordProvenance(
      scenarioId,
      hashes.input,
      hashes.output,
      hashes.parameters,
      hashes.modelVersion,
      ch
    );
    const receipt = await tx.wait();
    const iface = ledger.interface;
    const ev = receipt!.logs
      .map((log) => {
        try {
          return iface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
        } catch {
          return null;
        }
      })
      .find((p) => p?.name === "RecordCreated");
    expect(ev!.args[0]).to.equal(1n);
    expect(ev!.args[1]).to.equal(scenarioId);
    expect(ev!.args[2]).to.equal(ch);
    expect(ev!.args[3]).to.equal(authorized.address);
  });
});
