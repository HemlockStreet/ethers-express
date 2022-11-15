require('dotenv');
const port = process.env.PORT ? process.env.PORT : 8081;
const app = require('express')();
app.use(require('body-parser').json());
app.listen(port, () => {
  console.log('Listening On Port', port, '\n');
});
//
const fs = require('fs');
const Cache = require('./utils/fs/Cache');
const ethers = require('ethers');
let evm = new (require('./utils/evm/index.js'))(true);

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
  if (
    !req.body.user ||
    !req.body.user.address ||
    !req.body.user.message ||
    !req.body.user.signature ||
    !req.body.target ||
    !req.body.input
  ) {
    res.status(400).json('invalid input');
    return;
  }
  const validSignature = await verifyUser(req.body.user);
  if (!evm.credentials() || !validSignature) {
    res.status(500).json('cannot configure');
    return;
  }
  if (evm.credentials() !== req.body.user.address) {
    res.status(403).json('!authorized');
    return;
  }
  const { target, input } = req.body;
  if (target === 'rpc')
    new Cache('./rpc.json').update({ [input.network]: input.value });
  if (target === 'scanner')
    new Cache('./scanner.json').update({ [input.network]: input.value });
  evm = new (require('./utils/evm/index.js'))(true);
  res.status(200).json('success');
});

app.route('/cashout').post(async (req, res) => {
  if (
    !req.body.user ||
    !req.body.user.address ||
    !req.body.user.message ||
    !req.body.user.signature ||
    !req.body.input ||
    !req.body.input.value ||
    (req.body.input.type !== 'gas' && !req.body.input.address)
  ) {
    res.status(400).json('invalid input');
    return;
  }
  const validSignature = await verifyUser(req.body.user);
  if (
    !evm.credentials() ||
    !validSignature ||
    evm.credentials() !== req.body.user.address
  ) {
    res.status(403).json('!authorized');
    return;
  }
  const { type, value } = req.body.input;
  const { address } = req.body.user;
  try {
    if (type === 'gas')
      evm.signer().sendTransaction({
        to: address,
        value: ethers.utils.parseEther(value),
      });
    else if (type === 'ERC20') {
    } else if (type === 'ERC721') {
    } else throw new Error('invalid input');
  } catch (error) {
    res.status(400).json(error.toString());
  }

  res.status(200).json('success');
});
