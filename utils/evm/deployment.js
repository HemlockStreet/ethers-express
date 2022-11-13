const hre = require('hardhat');
const ethers = require('ethers');
const { verifiable } = require('./credentials');
const Cache = require('../fs/Cache');

async function verify(tx, options) {
  await new Promise((resolve) => setTimeout(resolve, 15000));
  try {
    await hre.run('verify:verify', options);
    console.log('|| Contract Verified!\n');
  } catch (e) {
    const reason = e.toString().split('\n')[2];
    if (reason === 'Reason: Already Verified') {
      console.log('|| Contract Verified!\n');
    } else if (
      reason ===
      `Reason: The Etherscan API responded that the address ${options.address} does not have bytecode.`
    ) {
      console.log('|| Contract Not Indexed! Awaiting 5 more confirmations...');
      for (let i = 0; i < 5; i++) await tx.wait();
      await verify(tx, options);
    } else throw e;
  }
}

async function runDeployment(name, network, args = []) {
  console.log(`\nDeploying ${name}`);
  const contract = await (
    await ethers.getContractFactory(name)
  ).deploy(...args);

  console.log('|| Contract Deployed! Awaiting 5 confirmations...');
  const tx = contract.deployTransaction;
  for (let i = 0; i < 5; i++) await tx.wait();
  new Cache(`./utils/evm/deploymentMap/${network}.json`).replace(
    name,
    contract.address
  );
  new Cache(`./utils/evm/interfaces/${name}.json`).update({
    abi: hre.artifacts.readArtifactSync(name).abi,
  });

  if (verifiable(network)) {
    console.log(`Verifying ${name}`);
    await verify(tx, {
      address: contract.address,
      constructorArguments: args.filter((arg) => typeof arg !== typeof {}),
      contract: fqn ? fqn : undefined,
    });
  }
  console.log();
  return contract;
}

module.exports = { runDeployment };
