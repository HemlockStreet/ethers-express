const hre = require('hardhat');
const { ethers, artifacts, network } = hre;
const {
  etherscan: { apiKey },
} = require('../../config.json');
const Cache = require('../../../../fs/Cache');

async function runDeployment(name, chainId, args = []) {
  console.log(`\nDeploying ${name}...`);
  const NewFactory = await ethers.getContractFactory(name);
  const NewContract = await NewFactory.deploy(...args);
  await NewContract.deployed();
  console.log(`|| ${name} deployed to ${NewContract.address}`);

  const { abi, bytecode } = artifacts.readArtifactSync(name);
  const address = NewContract.address;
  const deploymentMap = new Cache(`../deployments/${chainId}.json`);
  deploymentMap.update({ [name]: { abi, address, bytecode } });
  console.log(`|||| Saving artifacts...`);

  return NewContract;
}

async function verify(tx, options, chainId) {
  await tx.wait();
  await new Promise((resolve) => setTimeout(resolve, 15000));
  try {
    console.log('|| Verifying...');
    await hre.run('verify:verify', options);
    console.log('|||| Verified!');
  } catch (e) {
    const reason = e.toString().split('\n')[2];
    if (reason === 'Reason: Already Verified') console.log('|||| Verified!');
    else if (
      reason ===
      `Reason: The Etherscan API responded that the address ${options.address} does not have bytecode.`
    ) {
      console.log('|||| Contract not indexed, re-verifying...');
      await verify(tx, options, chainId);
    } else throw e;
  }
}

async function andVerify(name, chainId, args = [], fqn) {
  const NewContract = await runDeployment(name, chainId, args);
  if (!apiKey[network.name]) return NewContract;

  const tx = NewContract.deployTransaction;

  const options = {
    address: NewContract.address,
    constructorArguments: args.filter((arg) => typeof arg !== typeof {}),
    contract: fqn ? fqn : undefined,
  };

  await verify(tx, options, chainId);

  return NewContract;
}

module.exports = { runDeployment, andVerify };
