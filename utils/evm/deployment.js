const hre = require('hardhat');
const { artifacts } = hre;
const ethers = require('ethers');
const { verifiable } = require('./credentials');
const Cache = require('../fs/Cache');

async function runDeployment(name, network, args = []) {
  console.log(`\nDeploying ${name}...`);
  const NewFactory = await ethers.getContractFactory(name);
  const NewContract = await NewFactory.deploy(...args);

  await NewContract.deployed();
  console.log(`|| ${name} deployed to ${NewContract.address}`);

  const deploymentMap = new Cache(`./utils/evm/deploymentMap/${network}.json`);
  deploymentMap.replace(name, NewContract.address);
  console.log(`|||| Saving address...`);

  console.log(`|||| Saving artifacts...`);
  const abi = new Cache(`./utils/evm/interfaces/${name}.json`);
  abi.update({ abi: artifacts.readArtifactSync(name).abi });

  return NewContract;
}

async function verify(tx, options) {
  await tx.wait();
  await new Promise((resolve) => setTimeout(resolve, 15000));
  try {
    console.log('|| Verifying...');
    await hre.run('verify:verify', options);
    console.log('|||| Verified!');
  } catch (e) {
    const reason = e.toString().split('\n')[2];
    if (reason === 'Reason: Already Verified')
      console.log('|||||| Double Verified!');
    else if (
      reason ===
      `Reason: The Etherscan API responded that the address ${options.address} does not have bytecode.`
    ) {
      console.log('|||| Contract not indexed, re-verifying...');
      await verify(tx, options);
    } else throw e;
  }
}

async function andVerify(name, network, args = [], fqn) {
  const NewContract = await runDeployment(name, network, args);
  if (!verifiable(network)) return NewContract;

  const tx = NewContract.deployTransaction;

  const options = {
    address: NewContract.address,
    constructorArguments: args.filter((arg) => typeof arg !== typeof {}),
    contract: fqn ? fqn : undefined,
  };

  await verify(tx, options, network);

  return NewContract;
}

module.exports = { runDeployment, andVerify };
