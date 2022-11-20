const ethers = require('ethers');
const ChainConfig = require('./ChainConfig.json');
const Cache = require('../fs/Cache');

let credentials = {};
let hide = {};
const cache = new Cache('./config.json');
const config = cache.load();
const rpc = config.rpc;
const scan = config.scanner;

Object.keys(ChainConfig).forEach((network) => {
  let provider, scanner;
  if (rpc && rpc[network]) {
    provider = rpc[network];
    if (scan && scan[network]) scanner = scan[network];
    hide[network] = true;
  } else provider = ChainConfig[network].rpc;
  credentials[network] = { provider, scanner };
});

const verifiable = (name) => credentials[name]?.scanner;
const deployable = (name) => credentials[name]?.provider;

function getCredentials(printToConsole) {
  if (printToConsole)
    console.log('\n@EvmConfig\n\n|| Credentials\n|||| Scanners & Providers');

  let apiKey = {};
  Object.keys(credentials).forEach((name) => {
    if (deployable(name)) {
      if (printToConsole && !verifiable(name))
        console.log(
          `|||||| \x1B[33m${name} \x1B[39m- Scanner Key Missing (Unable to Verify)`
        );
      else {
        apiKey[name] = verifiable(name);
        if (printToConsole)
          console.log(
            `||||||\x1B[92m ${name}\x1B[39m (Able to Deploy && Verify)`
          );
      }
    } else if (printToConsole)
      console.log(
        `|||||| \x1B[31m${name} \x1B[39m - Provider Missing (Unable to Deploy || Verify)`
      );
  });
  const etherscan = { apiKey };

  if (printToConsole) console.log(`|||| Wallet`);
  let account, wallet;
  if (config.wallet) {
    account = config.wallet.privateKey;
    wallet = new ethers.Wallet(account);
  } else {
    if (printToConsole)
      console.log(`||||||\x1B[33m Missing Wallet Key! Generating...\x1B[39m`);
    wallet = ethers.Wallet.createRandom();
    const data = wallet._signingKey();
    account = data.privateKey;
    cache.update({ wallet: data });
  }
  if (printToConsole) console.log(`||||||\x1B[92m ${wallet.address}\x1B[39m`);

  let networks = {};
  Object.keys(credentials).forEach((name) => {
    const url = deployable(name);
    const accounts = [account];
    if (url) networks[name] = { url, accounts };
  });

  console.log(`|||| Gas Reporter`);
  let gasReporter = config.gasReporter;
  if (gasReporter) {
    if (!gasReporter.coinmarketcap) {
      gasReporter.enabled = false;
      console.log('|||||| \x1B[33mNo CoinMarketCap API Key\x1B[39m (Disabled)');
    }
    if (gasReporter.outputFile) gasReporter.noColors = true;
  }

  const admin = config.admin;

  return {
    evm: { etherscan, networks, gasReporter },
    api: { account, admin, hide },
  };
}

module.exports = { getCredentials, verifiable, deployable };
