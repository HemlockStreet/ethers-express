const { request } = require('unidici');
const ChainConfig = require('./ChainConfig');

const process = async (deployTransaction) => {
  for (let i = 0; i < 5; i++) await deployTransaction.wait();
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const endpoint = (network) => ChainConfig[network];

async function verificationStatus(network, req, tx) {
  const urlWithQuery = new URL(endpoint(network));
  const parameters = new URLSearchParams({ ...req });
  urlWithQuery.search = parameters.toString();

  let response;
  try {
    response = await request(urlWithQuery, { method: 'GET' });
    if (!(response.statusCode >= 200 && response.statusCode <= 299)) {
      const responseText = await response.body.text();
      throw new Error(
        `Verification Status Check - HttpError(${response.statusCode}): ${responseText}`
      );
    }
  } catch (error) {
    throw new Error('Verfier: ', error.message);
  }

  await handleResponse(await response.body.json(), tx);
}

async function handleResponse(res, tx) {
  if (res.result === 'Fail - Unable to verify') throw new Error(res.result);
  else if (res.result === 'Pending in queue') {
    console.log('Pending...');
    await delay(3000);
    await verificationStatus(network, req, tx);
  } else if (res.result.startsWIth('Unable to locate ContractCode at')) {
    console.log('Indexing...');
    await delay(3000);
    await process(tx);
    await verificationStatus(network, req, tx);
  } else if (res.result === 'Pass - Verified') {
    console.log('Success!');
    return true;
  } else if (parseInt(res.status, 10) !== 1) throw new Error(res.result);
}

async function verification(network, req, tx) {
  const url = endpoint(network);
  const parameters = new URLSearchParams({ ...req });
  const requestDetails = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: parameters.toString(),
  };

  let res;
  try {
    let response = await request(url, requestDetails);
    if (!(response.statusCode >= 200 && response.statusCode <= 299)) {
      // This could be always interpreted as JSON if there were any such guarantee in the Etherscan API.
      const responseText = await response.body.text();
      throw new Error(
        `Verification Request - HttpError(${response.statusCode}): ${responseText}`
      );
    }
  } catch (error) {
    throw new Error('Verifier: Failure to Send ', error.message);
  }

  return await handleResponse(await response.body.json(), tx);
}

module.exports = verification;
