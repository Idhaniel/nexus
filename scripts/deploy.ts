import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(await deployer.provider!.getBalance(deployer.address)),
    "POL"
  );

  const ProvenanceLedger = await ethers.getContractFactory("ProvenanceLedger");
  const contract = await ProvenanceLedger.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ProvenanceLedger deployed to:", address);
  console.log("Set NEXT_PUBLIC_CONTRACT_ADDRESS=" + address + " in your .env.local");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
