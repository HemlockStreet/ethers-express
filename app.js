require('dotenv').config();
const port = process.env.PORT ? process.env.PORT : 8080;
const express = require('express');
const bodyParser = require('body-parser');

const ethers = require('ethers');
const Cache = require('./utils/fs/Cache');
const EvmConfig = require('./utils/evm/index.js');

const app = express();
app.use(bodyParser.json());
if (process.argv[2] !== 'dev') {
  app.use(express.static('./client/build'));
  app.get('/', (req, res) => res.sendFile('./client/build/index.html'));
}
app.listen(port, () => console.log(`Listening On port:${port}\n`));

let evm = new EvmConfig(true);

if (!evm.busy) evm.deploy();

async function validateSignature(user) {
  const { address, signature, message } = user;
  try {
    const signerAddr = await ethers.utils.verifyMessage(message, signature);
    return address === signerAddr;
  } catch {
    return false;
  }
}

app.get('/sitrep', (req, res) =>
  res.status(200).json({
    deployer: evm.address(),
    networks: Object.keys(evm.networks),
    admin: evm.admin,
  })
);

app
  .route('/config')
  .get(async (req, res) => {
    const { address } = req.headers;
    const censor = address !== evm.admin;
    res.status(200).json({
      rpc: evm.availableNetworks(censor),
      scanner: evm.availableScanners(censor),
      gasReporter: evm.gasReporterSettings(censor),
    });
  })
  .post(async (req, res) => {
    const config = new Cache('./config.json');
    try {
      const { user, input } = req.body;
      const { target } = input;

      if (!['setup', 'scanner', 'rpc', 'gasReporter'].includes(target))
        throw new Error(`invalid target: ${target}`);

      let changes;
      if (target === 'setup') {
        if (evm.admin) throw new Error('already setup');
        else changes = { admin: user.address };
      }

      if (!changes) {
        if (!evm.admin) throw new Error('!setup');
        if (evm.admin !== user.address) throw new Error('!authorized');

        const { value } = input;
        if (target === 'gasReporter') {
          const { enabled, coinmarketcap, currency } = value;
          const outputFile = value.outputFile;
          const excludeContracts = value.excludeContracts;
          const gasReporter = {
            enabled,
            coinmarketcap,
            currency,
            outputFile,
            excludeContracts,
          };
          changes = { gasReporter };
        } else {
          const { network } = input;
          const data = config.load();
          changes = data[target]
            ? { [target]: { ...data[target], [network]: value } }
            : { [target]: { [network]: value } };
        }
      }

      if (!(await validateSignature(user))) throw new Error('signature !valid');

      config.update(changes);
      evm = new EvmConfig();
      res.status(200).json('success');
    } catch (error) {
      res.status(400).json(error.toString());
    }
  });

app.post('/cashout', async (req, res) => {
  try {
    const { user, input } = req.body;
    if (!evm.admin) throw new Error('!setup');
    if (evm.admin !== user.address) throw new Error('!authorized');
    if (!(await validateSignature(user))) throw new Error('signature !valid');
    const { network } = input;
    if (!Object.keys(evm.networks).includes(network))
      throw new Error('network !valid');

    const { assetType, value } = input;

    if (assetType === 'gas')
      await (
        await evm.signer(network).sendTransaction({
          to: evm.admin,
          value: ethers.utils.parseEther(value),
        })
      ).wait();
    else if (['ERC20', 'ERC721'].includes(assetType)) {
      const { address } = input;
      const tkn = evm.contract(assetType, network, address);
      let amount;
      if (assetType === 'ERC721') amount = parseInt(value);
      else {
        const decimals = await tkn.decimals();
        amount = (parseFloat(value) * 10 ** decimals).toString();
      }
      await (await tkn.transferFrom(evm.address(), evm.admin, amount)).wait();
    } else throw new Error('assetType !valid');
    res.status(200).json('success');
  } catch (error) {
    res.status(400).json(error.toString());
  }
});
