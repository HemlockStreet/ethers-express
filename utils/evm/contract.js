const ethers = require('ethers');
const Cache = require('../Cache');

function retrieve(name, chainId) {
  const { abi } = new Cache(`./utils/interfaces/${name}.json`).load();
  const deploymentMap = new Cache(`./utils/deploymentMap/${chainId}.json`);
  const address = deploymentMap.load()[name];
  return new ethers.Contract(address, abi, ethers.provider);
}

function interface(name, address) {
  const { abi } = new Cache(`./utils/interfaces/${name}.json`).load();
  return new ethers.Contract(address, abi, ethers.provider);
}

module.exports = { retrieve, interface };
