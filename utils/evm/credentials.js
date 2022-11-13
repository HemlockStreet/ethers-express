require('dotenv').config();
const { readFileSync, writeFileSync } = require('fs');
const ethers = require('ethers');

// .ENV EXTRACTION
const credentials = {
  mainnet: {
    scanner: process.env.ETHERSCAN,
    provider: process.env.MAINNET_PROVIDER,
  },
  goerli: {
    scanner: process.env.ETHERSCAN,
    provider: process.env.GOERLI_PROVIDER,
  },
  polygon: {
    scanner: process.env.POLYGONSCAN,
    provider: process.env.POLYGON_PROVIDER,
  },
  polygonMumbai: {
    scanner: process.env.POLYGONSCAN,
    provider: process.env.MUMBAI_PROVIDER,
  },
  bsc: {
    scanner: process.env.BSCSCAN,
    provider: process.env.BSC_PROVIDER,
  },
  bscTestnet: {
    scanner: process.env.BSCSCAN,
    provider: process.env.BSC_TESTNET_PROVIDER,
  },
  opera: {
    scanner: process.env.FTMSCAN,
    provider: process.env.OPERA_PROVIDER,
  },
  ftmTestnet: {
    scanner: process.env.FTMSCAN,
    provider: process.env.FTM_TESTNET_PROVIDER,
  },
  avalanche: {
    scanner: process.env.SNOWTRACE,
    provider: process.env.AVALANCHE_PROVIDER,
  },
  avalancheFujiTestnet: {
    scanner: process.env.SNOWTRACE,
    provider: process.env.FUJI_PROVIDER,
  },
};

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
  const WALLET_KEY = process.env.WALLET_KEY;
  if (printToConsole) console.log(`|||| Wallet`);

  let account = '';
  if (WALLET_KEY) {
    account = WALLET_KEY;

    if (printToConsole) {
      console.log(`||||||\x1B[92m ${WALLET_KEY}\x1B[39m`);
    }
  } else {
    if (printToConsole)
      console.log(
        `||||||\x1B[33m Missing Wallet Key! Generating account...\x1B[39m`
      );
    const wallet = ethers.Wallet.createRandom();
    account = wallet._signingKey().privateKey;
    writeFileSync(
      '.env',
      readFileSync('.env', 'utf-8') + `WALLET_KEY=${newKey}\n`
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
