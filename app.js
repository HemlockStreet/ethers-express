require('dotenv').config();

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const ethers = require('ethers');

const Cache = require('./utils/fs/Cache');
let evm = new (require('./utils/evm/index.js'))(true);

const app = express();
const port = process.env.PORT ? process.env.PORT : 8081;

app.use(bodyParser.json());
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('./client/build'));
  app.get('/', (req, res) => {
    res.sendFile('./client/build/index.html');
  });
}

async function verifyUser(user) {
  const { address, signature, message } = user;
  try {
    const signerAddr = await ethers.utils.verifyMessage(message, signature);
    return address === signerAddr;
  } catch {
    return false;
  }
}

app
  .route('/report')
  .get((req, res) => {
    const deployer = evm.address();
    const networks = Object.keys(evm.networks);
    const credentials = evm.credentials();
    res.status(200).json({ deployer, networks, credentials });
  })
  .post(async (req, res) => {
    const validSignature = await verifyUser(req.body.user);
    if (fs.existsSync('./access.json') || !validSignature) {
      res.status(500).json('cannot imprint');
      return;
    }
    new Cache('./access.json').update({ owner: req.body.user.address });
    res.status(200).json('success');
  });

app.route('/configure').post(async (req, res) => {
  try {
    const { user, target, input } = req.body;
    const validSignature = await verifyUser(user);
    if (!evm.credentials() || !validSignature) {
      res.status(500).json('cannot configure');
      return;
    }
    if (evm.credentials() !== user.address) {
      res.status(403).json('!authorized');
      return;
    }
    if (target === 'rpc')
      new Cache('./rpc.json').update({ [input.network]: input.value });
    if (target === 'scanner')
      new Cache('./scanner.json').update({ [input.network]: input.value });
    evm = new (require('./utils/evm/index.js'))(true);
    res.status(200).json('success');
  } catch (error) {
    res.status(400).json(error.toString());
  }
});

app.route('/cashout').post(async (req, res) => {
  try {
    const { user, input } = req.body;
    const validSignature = await verifyUser(user);
    if (
      !evm.credentials() ||
      !validSignature ||
      evm.credentials() !== user.address
    ) {
      res.status(403).json('!authorized');
      return;
    }

    const { assetType, value, network } = input;
    if (assetType === 'gas')
      await (
        await evm.signer(network).sendTransaction({
          to: user.address,
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
      await (
        await tkn.transferFrom(evm.address(), user.address, amount)
      ).wait();
    } else throw new Error('invalid assetType');
    res.status(200).json('success');
  } catch (error) {
    res.status(400).json(error.toString());
  }
});

app.listen(port, () => console.log('Listening On Port', port, '\n'));
