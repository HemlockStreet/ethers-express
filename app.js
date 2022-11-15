const fs = require('fs');
if (!fs.existsSync(`.env`)) {
  fs.writeFileSync('.env', fs.readFileSync('sample.env', 'utf-8'));
  console.log(
    '\n\x1B[31mENV FILE NOT DETECTED\x1B[39m\n\x1B[33mOne has been generated for your convenience. Please try that again!\x1B[39m\n'
  );
  process.exit(1);
}
//
require('dotenv');
const port = process.env.PORT ? process.env.PORT : 8081;
const app = require('express')();
app.use(require('body-parser').json());
app.listen(port, () => {
  console.log('Listening On Port', port, '\n');
});
//
const ethers = require('ethers');
const evm = new (require('./utils/evm/index.js'))(true);
const Cache = require('./utils/fs/Cache');

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
  .post((req, res) => {
    const validSignature = verifyUser(req.body.user);
    if (fs.existsSync('./access.json') || !validSignature) {
      res.status(500).text('cannot imprint');
      return;
    }

    new Cache('./access.json').update({ owner: req.body.user.address });
    res.status(200).json('success');
  });
