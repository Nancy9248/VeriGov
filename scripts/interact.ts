import hre from "hardhat";
import crypto from "crypto";

async function main() {
  const { ethers } = await hre.network.connect();
  const [admin] = await ethers.getSigners();

  // Deploy fresh for this test
  const DocumentVerification = await ethers.getContractFactory("DocumentVerification");
  const contract = await DocumentVerification.deploy();
  await contract.waitForDeployment();
  console.log("Contract deployed at:", await contract.getAddress());

  // Simulate a document (in real app, this would be actual ID document content)
  const documentContent = "Aadhaar-ID-1234-5678-9012-Tarushi";
  const docHash = "0x" + crypto.createHash("sha256").update(documentContent).digest("hex");
  console.log("\nOriginal document hash:", docHash);

  // Issuer registers the document
  console.log("\n--- Registering document ---");
  const tx = await contract.registerDocument(docHash);
  await tx.wait();
  console.log("Document registered by:", admin.address);

  // Verify the genuine document
  console.log("\n--- Verifying genuine document ---");
  const [isValid, issuer, timestamp] = await contract.verifyDocument(docHash);
  console.log("Is valid:", isValid);
  console.log("Issued by:", issuer);
  console.log("Timestamp:", new Date(Number(timestamp) * 1000).toLocaleString());

  // Now simulate a TAMPERED document
  console.log("\n--- Verifying TAMPERED document ---");
  const tamperedContent = "Aadhaar-ID-1234-5678-9012-Tarushi-HACKED";
  const tamperedHash = "0x" + crypto.createHash("sha256").update(tamperedContent).digest("hex");
  const [isValidTampered] = await contract.verifyDocument(tamperedHash);
  console.log("Is tampered document valid:", isValidTampered);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});