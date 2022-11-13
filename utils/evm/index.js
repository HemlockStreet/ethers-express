require('./envCheck');
require('dotenv').config();
const { ethers } = require('ethers');
const { getCredentials } = require('./credentials');
const Cache = require('../fs/Cache');

class Evm {
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

  contract(name, network, addr) {
    const { abi } = new Cache(`./utils/evm/interfaces/${name}.json`).load();
    const address =
      addr && ethers.utils.isAddress(addr)
        ? addr
        : new Cache(`./utils/evm/deploymentMap/${network}.json`).load()[name];
    const providerOrSigner = this.signer(network);
    return new ethers.Contract(address, abi, providerOrSigner);
  }
}

module.exports = Evm;
