require('dotenv').config();
const fs = require('fs');
const { ethers } = require('ethers');
const { getCredentials } = require('./credentials');
const Cache = require('../fs/Cache');

const pathTo = {
  mapping: `./utils/evm/deployments`,
  interfaces: `./utils/evm/interfaces`,
};
if (!fs.existsSync(pathTo.mapping)) fs.mkdirSync(pathTo.mapping);
if (!fs.existsSync(pathTo.interfaces)) fs.mkdirSync(pathTo.interfaces);

class EvmConfig {
  constructor(printToConsole, solidityArgs) {
    const {
      evm: { etherscan, networks, gasReporter },
      api: { account, admin, hide },
    } = getCredentials(printToConsole);
    let processed = {};
    Object.keys(networks).forEach(
      (name) =>
        (processed[name] = { url: networks[name].url, hide: hide[name] })
    );
    this.networks = processed;
    this.etherscan = etherscan?.apiKey;
    this.gasReporter = gasReporter;
    this.account = account;
    this.admin = admin;

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

    this.busy = false;
    console.log();
  }

  availableNetworks(censor) {
    if (!censor) return this.networks;
    let censored = {};
    Object.keys(this.networks).forEach((name) => {
      const temp = this.networks[name];
      censored[name] = temp.hide ? 'CUSTOM RPC URL' : temp.url;
    });
    return censored;
  }

  availableScanners(censor) {
    if (!censor) return this.etherscan;
    let censored = {};
    Object.keys(this.networks).forEach((name) => {
      if (this.etherscan[name]) censored[name] = 'Configured';
      else censored[name] = 'Unconfigured';
    });
    return censored;
  }

  gasReporterSettings(censor) {
    let result = this.gasReporter;
    if (!result.coinmarketcap) result.coinmarketcap = 'Unconfigured';
    if (!censor) return result;
    if (result.coinmarketcap !== 'Unconfigured')
      result.coinmarketcap = 'Configured';
    return result;
  }

  address() {
    return new ethers.Wallet(this.account).address;
  }

  provider(selected) {
    return new ethers.providers.JsonRpcProvider(this.networks[selected].url);
  }

  signer(selected) {
    return new ethers.Wallet(this.account, this.provider(selected));
  }

  contract(name, network, addr, contractAbi) {
    const abi = contractAbi
      ? contractAbi
      : new Cache(`${pathTo.interfaces}/${name}.json`).load()[name].abi;
    const address = addr
      ? addr
      : new Cache(`${pathTo.mapping}/${network}.json`).load()[name].address;

    const providerOrSigner = this.signer(network);
    return new ethers.Contract(address, abi, providerOrSigner);
  }

  deploy() {
    // coming soon
  }
}

module.exports = EvmConfig;
