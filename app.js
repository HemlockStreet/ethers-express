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
    const credentials = fs.existsSync('./access.json')
      ? new Cache('./access.json').load().owner
      : undefined;
    res.status(200).json({ deployer, networks, credentials });
  })
  .post(async (req, res) => {
    const validSignature = await verifyUser(req.body.user);
    if (fs.existsSync('./access.json') || !validSignature) {
      res.status(500).text('cannot imprint');
      return;
    }
    new Cache('./access.json').update({ owner: req.body.user.address });
    res.status(200).json('success');
  });

app.route('/test').post(async (req, res) => {
  new Cache('./file.json').update(req.body);
  res.status(200).json('success');
});
