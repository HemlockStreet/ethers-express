require('dotenv').config();
const { readFileSync, writeFileSync, existsSync } = require('fs');
const ethers = require('ethers');
const ChainConfig = require('./ChainConfig.json');

let credentials = {};
const customRpc = existsSync('./rpc.json')
  ? JSON.parse(readFileSync('./rpc.json'))
  : undefined;

const scannerKey = existsSync('./scanner.json')
  ? JSON.parse(readFileSync('./scanner.json'))
  : undefined;

Object.keys(ChainConfig).forEach((network) => {
  credentials[network] = {
    provider:
      customRpc && customRpc[network]
        ? customRpc[network]
        : ChainConfig[network].rpc,
    scanner:
      scannerKey && scannerKey[network] ? scannerKey[network] : undefined,
  };
});

// BASIC CREDENTIAL DIAGNOSTICS
const verifiable = (name) => credentials[name]?.scanner;
const deployable = (name) => credentials[name].provider;

function getCredentials(printToConsole) {
  // PREPARE HARDHAT VERIFIER CREDENTIALS
  if (printToConsole)
    console.log(
      '\nPreparing EvmConfig...\n\n|| Credentials\n|||| Scanners & Providers'
    );

  let apiKey = {};
  Object.keys(credentials).forEach((name) => {
    if (deployable(name)) {
      if (printToConsole && !verifiable(name))
        console.log(
          `|||||| \x1B[33m${name} \x1B[39m- Scanner Key Missing (Unable to Verify)`
        );
      else {
        apiKey[name] = verifiable(name);

        if (printToConsole) console.log(`||||||\x1B[92m ${name}\x1B[39m`);
      }
    } else {
      if (printToConsole)
        console.log(
          `|||||| \x1B[31m${name} \x1B[39m - Provider Missing (Unable to Deploy)`
        );
    }
  });

  const etherscan = { apiKey };

  // PREPARE EVM WALLET CREDENTIALS
  if (printToConsole) console.log(`|||| Wallet`);

  let account = '';
  if (existsSync('./wallet.json')) {
    account = JSON.parse(readFileSync('./wallet.json')).privateKey;
    const wallet = new ethers.Wallet(account);

    if (printToConsole) {
      console.log(`||||||\x1B[92m ${wallet.address}\x1B[39m`);
    }
  } else {
    if (printToConsole)
      console.log(
        `||||||\x1B[33m Missing Wallet Key! Generating account...\x1B[39m`
      );
    const wallet = ethers.Wallet.createRandom();
    account = wallet._signingKey().privateKey;
    writeFileSync(
      './wallet.json',
      JSON.stringify(wallet._signingKey(), undefined, 2)
    );
    if (printToConsole) {
      console.log(`||||||\x1B[92m ${wallet.address}\x1B[39m`);
    }
  }

  // PREPARE NETWORK PROVIDER CREDENTIALS
  let networks = {};
  Object.keys(credentials).forEach((name) => {
    if (deployable(name)) networks[name] = deployable(name);
  });
  networks.walletKey = account;
  return { etherscan, networks };
}

module.exports = { getCredentials, verifiable, deployable };
