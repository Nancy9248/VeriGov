import hre from "hardhat";

async function main() {
 const { ethers } = await hre.network.connect("sepolia");

  console.log("Deploying DocumentVerification contract...");

  const DocumentVerification = await ethers.getContractFactory("DocumentVerification");
  const contract = await DocumentVerification.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("DocumentVerification deployed to:", address);

  const [deployer] = await ethers.getSigners();
  console.log("Deployed by (admin/first issuer):", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});