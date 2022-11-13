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

const evm = new (require('./utils/evm/index.js'))(true);

const app = require('express')();
app.use(require('body-parser').json());
const port = PORT ? PORT : 8081;
app.listen(port, () => {
  console.log('Listening On Port', port, '\n');
});

app.get('/', (req, res) => {
  res.json('Hello, welcome to my back end! Now git out.');
});
