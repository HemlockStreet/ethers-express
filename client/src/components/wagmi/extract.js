function fromInterface(name) {
  const abi = require(`./interfaces/${name}.json`).abi;
  return abi;
}

function fromCache(name, chainId) {
  const basePath = `./data/${chainId}/${name}`;
  const abi = require(`${basePath}.json`).abi;
  const address = require(`${basePath}-address.json`).address;
  return { abi, address };
}

export { fromInterface, fromCache };
