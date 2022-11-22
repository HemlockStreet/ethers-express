// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require('hardhat');
const deployment = require('./utils/deployment');

async function main() {
  const { chainId } = await hre.ethers.provider.getNetwork();
  const unlockTime = Math.round(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const value = hre.ethers.utils.parseUnits('1.0', 'gwei');
  const lock = await deployment.andVerify('Lock', chainId, [
    unlockTime,
    { value },
  ]);
  console.log('Lock with 1 ETH deployed to:', lock.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
