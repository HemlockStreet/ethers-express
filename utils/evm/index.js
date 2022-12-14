require('dotenv').config();
const fs = require('fs');
const { ethers } = require('ethers');
const { getCredentials } = require('./credentials');
const Cache = require('../fs/Cache');
const child_process = require('child_process');
const process = require('process');

function spawn(...command) {
  let p = child_process.spawn(command[0], command.slice(1));
  return new Promise((resolveFunc) => {
    p.stdout.on('data', (x) => process.stdout.write(x.toString()));
    p.stderr.on('data', (x) => process.stderr.write(x.toString()));
    p.on('exit', (code) => resolveFunc(code));
  });
}

function exec(...command) {
  let p = child_process.exec(command[0], command.slice(1));
  return new Promise((resolveFunc) => {
    p.stdout.on('data', (x) => process.stdout.write(x.toString()));
    p.stderr.on('data', (x) => process.stderr.write(x.toString()));
    p.on('exit', (code) => resolveFunc(code));
  });
}

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
    const pkg = require('../../package.json');
    let version = pkg.dependencies.solc
      ? pkg.dependencies.solc
      : pkg.devDependencies.solc;
    if (version.includes('^')) version = version.split('^')[1];
    this.solidity = !solidityArgs
      ? { version, settings: { optimizer } }
      : {
          ...solidityArgs,
          settings: {
            ...solidityArgs.settings,
            optimizer: { ...optimizer, ...solidityArgs.settings.optimizer },
          },
        };

    new Cache('./utils/evm/hardhat/config.json').update({
      solidity: this.solidity,
      etherscan,
      networks,
      gasReporter,
    });

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

  async deploy() {
    if (this.busy) throw new Error('DEPLOY: wallet key busy');
    this.busy = true;
    await exec('"./bin/deploy.sh"');
    this.busy = false;
  }
}

module.exports = EvmConfig;
