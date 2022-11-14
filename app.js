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
const { PORT } = process.env;
const EvmConfig = require('./utils/evm/index.js');

const evm = new EvmConfig(true);

const app = require('express')();
app.use(require('body-parser').json());
const port = PORT ? PORT : 8081;
app.listen(port, () => {
  console.log('Listening On Port', port, '\n');
});

app.get('/report', (req, res) => {
  const deployer = evm.address();
  const networks = Object.keys(evm.networks);
  res.status(200).json({ deployer, networks });
});
