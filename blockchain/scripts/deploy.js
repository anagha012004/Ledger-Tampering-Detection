const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Contract = await ethers.getContractFactory("LedgerTampering");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("LedgerTampering deployed to:", address);

  const artifact   = require("../artifacts/contracts/LedgerTampering.sol/LedgerTampering.json");
  const deployment = { address, abi: artifact.abi };

  const outPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log("Deployment info saved to deployment.json");
}

main().catch(e => { console.error(e); process.exit(1); });
