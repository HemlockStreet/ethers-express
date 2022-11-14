require('dotenv').config();
const fs = require('fs');
const { ethers } = require('ethers');
const { getCredentials } = require('./credentials');
const Cache = require('../fs/Cache');

const pathTo = {
  mapping: `./utils/evm/deploymentMap`,
  abis: `./utils/evm/interfaces`,
};
if (!fs.existsSync(pathTo.mapping)) fs.mkdirSync(pathTo.mapping);
if (!fs.existsSync(pathTo.abis)) fs.mkdirSync(pathTo.abis);

class EvmConfig {
  constructor(printToConsole, solidityArgs) {
    const { etherscan, networks } = getCredentials(printToConsole);
    this.etherscan = etherscan;
    this.walletKey = networks.walletKey;
    let filtered = networks;
    delete filtered.walletKey;
    this.networks = filtered;

    const optimizer = { enabled: true, runs: 200 };
    this.solidity = !solidityArgs
      ? { settings: { optimizer } }
      : {
          ...solidityArgs,
          settings: {
            ...solidityArgs.settings,
            optimizer: { ...optimizer, ...solidityArgs.settings.optimizer },
          },
        };
    console.log();
  }

  provider(network) {
    return new ethers.providers.JsonRpcProvider(this.networks[network]);
  }

  signer(network) {
    return new ethers.Wallet(this.walletKey, this.provider(network));
  }

  address() {
    return new ethers.Wallet(this.walletKey).address;
  }

  contract(name, network, addr, contractAbi) {
    const abi = contractAbi
      ? contractAbi
      : new Cache(`./utils/evm/interfaces/${name}.json`).load().abi;
    const address =
      addr && ethers.utils.isAddress(addr)
        ? addr
        : new Cache(`./utils/evm/deploymentMap/${network}.json`).load()[name];

    const providerOrSigner = this.signer(network);
    return new ethers.Contract(address, abi, providerOrSigner);
  }

  deploy() {
    // coming soon
  }
}

module.exports = EvmConfig;
