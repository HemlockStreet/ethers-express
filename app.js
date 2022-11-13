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
