const fs = require('fs');
const solc = require('solc');

const getContent = (pathTo) => fs.readFileSync(pathTo, { encoding: 'utf-8' });

const source = (pathTo) => {
  let result = {};
  const key = pathTo.split('/')[pathTo.split('/').length - 1];
  const content = getContent(pathTo);
  result[key] = { content };
  return result;
};

function compile(contractName) {
  const input = {
    language: 'Solidity',
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
    sources: { ...source('./contracts/Token.sol') },
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), {
      import: () => {
        if (pathTo[0] !== '.')
          return {
            contents: getContent(`./node_modules/${pathTo}`),
          };
        else return { error: 'File not found' };
      },
    })
  );

  return output.contracts[fileName][contractName];
}
