const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("LedgerTampering", function () {
  let contract, owner;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("LedgerTampering");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("deploys with 3 clean nodes", async () => {
    const nodes = await contract.getAllNodes();
    expect(nodes.length).to.equal(3);
    nodes.forEach(n => expect(n.tampered).to.be.false);
  });

  it("adds a transaction to all 3 nodes", async () => {
    await (await contract.addTransaction("Alice", "Bob", 500n)).wait();
    const nodes = await contract.getAllNodes();
    nodes.forEach(n => expect(Number(n.entryCount)).to.equal(1));
  });

  it("all nodes share the same ledger hash after a transaction", async () => {
    await (await contract.addTransaction("Alice", "Bob", 500n)).wait();
    const nodes = await contract.getAllNodes();
    expect(nodes[0].ledgerHash).to.equal(nodes[1].ledgerHash);
    expect(nodes[1].ledgerHash).to.equal(nodes[2].ledgerHash);
  });

  it("tamperNode: only the tampered node's entry is flagged by detectTampering", async () => {
    await (await contract.addTransaction("Alice", "Bob", 500n)).wait();
    await (await contract.tamperNode(0, 1, 9999n)).wait();
    await (await contract.detectTampering()).wait();

    const [nodeA, nodeB, nodeC] = await contract.getAllNodes();
    expect(nodeA.tampered).to.be.true;   // Node-A was attacked
    expect(nodeB.tampered).to.be.false;  // Node-B is clean
    expect(nodeC.tampered).to.be.false;  // Node-C is clean
  });

  it("detectTampering marks tampered entry", async () => {
    await (await contract.addTransaction("Alice", "Bob", 500n)).wait();
    await (await contract.tamperNode(0, 1, 9999n)).wait();
    await (await contract.detectTampering()).wait();
    const entries = await contract.getEntries(0);
    expect(entries[0].tampered).to.be.true;
  });

  it("untampered nodes pass detectTampering", async () => {
    await (await contract.addTransaction("Alice", "Bob", 500n)).wait();
    const tx = await contract.detectTampering();
    const receipt = await tx.wait();
    const events = receipt.logs
      .map(l => { try { return contract.interface.parseLog(l); } catch { return null; } })
      .filter(e => e?.name === "TamperingDetected");
    expect(events.length).to.equal(0);
  });

  it("reset clears all entries and resets hashes", async () => {
    await (await contract.addTransaction("Alice", "Bob", 500n)).wait();
    await (await contract.reset()).wait();
    const nodes = await contract.getAllNodes();
    nodes.forEach(n => {
      expect(Number(n.entryCount)).to.equal(0);
      expect(n.tampered).to.be.false;
    });
  });
});
