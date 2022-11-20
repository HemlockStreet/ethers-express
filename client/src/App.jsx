import { createContext, useRef, useState, useEffect, useContext } from 'react';

import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import cryptoRandomString from 'crypto-random-string';
import * as wagmi from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import { Container, Row, Spinner } from 'react-bootstrap';
import NavigationBar from './components/core/NavigationBar';
import Config from './components/core/Config';

export const WagmiContext = createContext(null);
export const ApiContext = createContext(null);
export const DappContext = createContext(null);

const randomString = () =>
  cryptoRandomString({
    length: 132,
    type: 'alphanumeric',
  });

function Dapp() {
  const { account, network, signer } = useContext(WagmiContext);

  const currentNetwork = () => {
    const chainId = network.chain.id;
    let name;
    Object.keys(wagmi.chain).forEach((networkName) => {
      const thisChain = wagmi.chain[networkName];
      if (chainId === thisChain.id) name = networkName;
    });
    return name;
  };

  const idOf = (name) => wagmi.chain[name].id;

  const [signature, setSignature] = useState();
  const onRequest = () => setSignature();

  const message = useRef(randomString());
  const user = useRef();
  const onSignature = (data) => {
    user.current = {
      address: account.address,
      message: message.current,
      signature: data,
    };
    message.current = randomString();
    setSignature(true);
  };

  const [signerGasBalanceEnabled, setSignerGasBalanceEnabled] = useState(false);
  const toggleSignerGasBalance = () =>
    setSignerGasBalanceEnabled(!signerGasBalanceEnabled);
  const signerGasBalance = wagmi.useBalance({
    address: account.address,
    enabled: signerGasBalanceEnabled,
    watch: true,
    formatUnits: 'ether',
  });

  return (
    <DappContext.Provider
      value={{
        account,
        network,
        signer,
        currentNetwork,
        idOf,

        signature,
        onRequest,
        message,
        user,

        onSignature,
        signerGasBalance,
        toggleSignerGasBalance,
      }}
    >
      <Config />
    </DappContext.Provider>
  );
}

function Website() {
  const network = wagmi.useNetwork();
  const account = wagmi.useAccount();
  const signer = wagmi.useSigner();

  return (
    <div className="app">
      <WagmiContext.Provider value={{ network, account, signer }}>
        <NavigationBar connect={true} />
        {network.chain && <Dapp />}
      </WagmiContext.Provider>
    </div>
  );
}

function Wagmi() {
  const { report } = useContext(ApiContext);

  const selected = report.networks.map((name) => wagmi.chain[name]);
  const { chains, provider } = wagmi.configureChains(selected, [
    publicProvider(),
  ]);

  const wagmiClient = (name, autoConnect) => {
    const { connectors } = getDefaultWallets({ name, chains });
    return wagmi.createClient({ autoConnect, connectors, provider });
  };

  return (
    <wagmi.WagmiConfig client={wagmiClient('BackendFrontend', true)}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <Website />
      </RainbowKitProvider>
    </wagmi.WagmiConfig>
  );
}

export function App() {
  const [report, setReport] = useState();
  const error = useRef(false);
  const loading = useRef(false);
  async function getReport() {
    if (loading.current === true) return;
    if (error.current) error.current = false;
    loading.current = true;
    try {
      const res = await fetch(`sitrep`, {
        mode: 'cors',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`${res.status} - ${res.statusText}`);
      setReport(await res.json());
    } catch (error) {
      error.current = error.toString();
    } finally {
      loading.current = false;
    }
  }

  useEffect(() => {
    if (!report) getReport();
  }, [report]);

  return (
    <div className="app">
      {!report ? (
        <div>
          <NavigationBar />
          <Container>
            {loading.current && (
              <Row>
                <Spinner animation="border" variant="secondary" size="lg" />
                <p>Awaiting Backend Response...</p>
              </Row>
            )}

            {error.current !== false && (
              <Row>
                <h3>Failure</h3>
                <p>
                  {error}
                  <br />
                  Please Try Again Later...
                </p>
              </Row>
            )}
          </Container>
        </div>
      ) : (
        <ApiContext.Provider value={{ report, getReport }}>
          <Wagmi />
        </ApiContext.Provider>
      )}
    </div>
  );
}
