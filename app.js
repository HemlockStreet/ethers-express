require('dotenv');
const app = require('express')();
app.use(require('body-parser').json());
const port = process.env.PORT ? process.env.PORT : 8081;

const evm = new (require('./utils/evm/index.js'))(true);

app.get('/', (req, res) => {
  res.json('Hello, welcome to my back end! Now git out.');
});

app.listen(port, () => {
  console.log('Listening On Port', port);
});
